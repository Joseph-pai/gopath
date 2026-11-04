import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BoardSurface from './BoardSurface';
import { BoardCoordinateLabels } from './BoardCoords';
import Stone, { CapturedStone } from './Stone';
import Highlight from './Highlight';
import { tryPlaceStone } from '../lib/goRules';
import type { Board, Color, BoardSize, Point, HighlightType, Move, TerritoryRegion } from '../types/go';

interface GoSceneProps {
  boardSize: BoardSize;
  boardMode?: 'lesson' | 'play' | 'review';
  showLiberties?: Point[];
  showHighlights?: { point: Point; type: HighlightType }[];
  territoryMarks?: TerritoryRegion[];
  allowedMoves?: Point[];
  cellSize?: number;
  onPlaceStone?: (x: number, y: number, color: Color, result: {
    ok: boolean;
    reason?: string;
    captured?: Point[];
    newBoard: Board;
  }) => void;
  onInvalidMove?: (x: number, y: number, reason: string) => void;
  board: Board;
  setBoard: (board: Board) => void;
  currentPlayer: Color;
  setCurrentPlayer: (color: Color) => void;
  moveHistory: Move[];
  setMoveHistory: (moves: Move[]) => void;
}

// 点击检测器（支持鼠标与触屏，通过移动距离区分"点击落子"与"拖拽旋转"）
function ClickHandler({ 
  boardSize, cellSize, halfBoard, onCellClick 
}: { 
  boardSize: BoardSize;
  cellSize: number;
  halfBoard: number;
  onCellClick: (x: number, y: number) => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const boardPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;

    const toBoardPoint = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(boardPlane, intersectPoint)) {
        const x = Math.round((intersectPoint.x + halfBoard) / cellSize);
        const y = Math.round((intersectPoint.z + halfBoard) / cellSize);
        if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
          return { x, y };
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!downPos.current) return;
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      downPos.current = null;
      // 移动超过阈值视为拖拽（旋转/平移），不落子
      if (Math.sqrt(dx * dx + dy * dy) > 8) return;
      const pt = toBoardPoint(e.clientX, e.clientY);
      if (pt) onCellClick(pt.x, pt.y);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [camera, gl, boardSize, cellSize, halfBoard, onCellClick, boardPlane]);

  return null;
}

// 用 Canvas 生成领地编号纹理（圆形底 + 数字）
function createTerritoryTexture(text: string, color: Color): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const r = size * 0.46;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = color === 'black' ? 'rgba(20,20,20,0.88)' : 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = color === 'black' ? '#ffffff' : '#444444';
  ctx.lineWidth = size * 0.04;
  ctx.stroke();

  ctx.fillStyle = color === 'black' ? '#ffffff' : '#1a1a1a';
  ctx.font = `bold ${Math.round(size * 0.58)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + size * 0.02);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 领地编号贴片（平铺在棋盘上，标记领地中心位置）
function TerritoryLabel({ text, color, position, cellSize }: {
  text: string;
  color: Color;
  position: [number, number, number];
  cellSize: number;
}) {
  const texture = useMemo(() => createTerritoryTexture(text, color), [text, color]);
  const s = cellSize * 0.6;
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[s, s]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

export default function GoScene({
  boardSize,
  board,
  setBoard,
  currentPlayer,
  setCurrentPlayer,
  moveHistory,
  setMoveHistory,
  boardMode = 'play',
  showLiberties,
  showHighlights,
  territoryMarks,
  allowedMoves,
  cellSize = 1,
  onPlaceStone,
  onInvalidMove,
}: GoSceneProps) {
  const halfBoard = ((boardSize - 1) * cellSize) / 2;
  const [previousBoard, setPreviousBoard] = useState<Board | null>(null);
  const [message, setMessage] = useState<string>('');
  const [animatingCaptured, setAnimatingCaptured] = useState<Point[]>([]);
  const controlsRef = useRef<any>(null);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (boardMode === 'lesson' && allowedMoves && allowedMoves.length > 0) {
      const isAllowed = allowedMoves.some(p => p.x === x && p.y === y);
      if (!isAllowed) {
        setMessage('请选择推荐的着法');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
    }
    
    const result = tryPlaceStone(board, x, y, currentPlayer, previousBoard);
    
    if (!result.ok) {
      const reasonMap: Record<string, string> = {
        occupied: '此处已有棋子',
        suicide: '禁入点：落子后无气且不能提子',
        ko: '打劫：不能立即提回，请先找劫材',
      };
      setMessage(reasonMap[result.reason || ''] || '无法落子');
      setTimeout(() => setMessage(''), 2000);
      onInvalidMove?.(x, y, result.reason || '');
      return;
    }
    
    setPreviousBoard(board);
    setBoard(result.newBoard!);
    setMoveHistory([...moveHistory, { x, y, color: currentPlayer, captured: result.captured || [] }]);
    
    if (result.captured && result.captured.length > 0) {
      setAnimatingCaptured(result.captured);
    }
    
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    
    onPlaceStone?.(x, y, currentPlayer, {
      ok: true,
      reason: result.reason,
      captured: result.captured,
      newBoard: result.newBoard!,
    });
    
    setMessage('');
  }, [board, currentPlayer, previousBoard, boardMode, allowedMoves, moveHistory, 
      setBoard, setCurrentPlayer, setMoveHistory, onPlaceStone, onInvalidMove]);

  const stones = useMemo(() => {
    const lastMove = moveHistory[moveHistory.length - 1];
    const items: React.ReactNode[] = [];
    
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const color = board[y][x];
        if (color) {
          const isLast = !!(lastMove && lastMove.x === x && lastMove.y === y);
          items.push(
            <Stone
              key={`${x}-${y}`}
              x={x}
              y={y}
              color={color}
              cellSize={cellSize}
              halfBoard={halfBoard}
              isLastMove={isLast}
              animating={false}
            />
          );
        }
      }
    }
    return items;
  }, [board, boardSize, cellSize, halfBoard, moveHistory]);

  const libertyHighlights = useMemo(() => {
    if (!showLiberties) return null;
    return showLiberties.map((p, i) => (
      <Highlight 
        key={`lib-${i}`} 
        point={p} 
        type="liberty" 
        cellSize={cellSize} 
        halfBoard={halfBoard} 
      />
    ));
  }, [showLiberties, cellSize, halfBoard]);

  const otherHighlights = useMemo(() => {
    if (!showHighlights) return null;
    return showHighlights.map((h, i) => (
      <Highlight 
        key={`hl-${i}`} 
        point={h.point} 
        type={h.type} 
        cellSize={cellSize} 
        halfBoard={halfBoard} 
      />
    ));
  }, [showHighlights, cellSize, halfBoard]);

  const territoryMarkNodes = useMemo(() => {
    if (!territoryMarks || territoryMarks.length === 0) return null;
    return territoryMarks.map((t) => {
      const worldX = -halfBoard + t.center.x * cellSize;
      const worldZ = -halfBoard + t.center.y * cellSize;
      return (
        <TerritoryLabel
          key={`terr-${t.index}`}
          text={String(t.index)}
          color={t.color}
          position={[worldX, 0.32, worldZ]}
          cellSize={cellSize}
        />
      );
    });
  }, [territoryMarks, halfBoard, cellSize]);

  const capturedStones = animatingCaptured.map((p, i) => (
    <CapturedStone
      key={`cap-${i}`}
      point={p}
      cellSize={cellSize}
      halfBoard={halfBoard}
      color={currentPlayer === 'black' ? 'white' : 'black'}
      onComplete={() => {
        setAnimatingCaptured(prev => prev.filter((_, idx) => idx !== i));
      }}
    />
  ));

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 12, 14], fov: 45 }}
        shadows
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 15, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        <BoardSurface size={boardSize} cellSize={cellSize} />
        <BoardCoordinateLabels size={boardSize} cellSize={cellSize} />
        {stones}
        {capturedStones}
        {libertyHighlights}
        {otherHighlights}
        {territoryMarkNodes}
        
        <ClickHandler 
          boardSize={boardSize} 
          cellSize={cellSize} 
          halfBoard={halfBoard}
          onCellClick={handleCellClick}
        />
        
        <OrbitControls
          ref={controlsRef}
          enablePan
          screenSpacePanning={false}
          minDistance={8}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
      
      {/* 原始视图复位按钮 */}
      <button
        onClick={() => controlsRef.current?.reset()}
        className="absolute bottom-4 right-4 bg-amber-700/90 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="回到原始视角"
      >
        ⌂ 原始视图
      </button>
      
      {message && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
}
