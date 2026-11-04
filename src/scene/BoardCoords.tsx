// 围棋坐标工具与 3D 棋盘丝印坐标
import { useMemo } from 'react';
import * as THREE from 'three';

const COLUMNS = 'ABCDEFGHJKLMNOPQRST'; // 跳过 I

// 辅助函数：数组坐标 -> 显示坐标
export function arrayToDisplay(x: number, y: number, size: number): string {
  const col = COLUMNS[x] || '?';
  const row = size - y;
  return `${col}${row}`;
}

// 用 Canvas 生成单个文字的纹理（丝印效果，印在棋盘木框上）
function createTextTexture(text: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#2a1808';
  ctx.font = `bold ${Math.round(size * 0.7)}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + size * 0.02);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 单个坐标文字贴片（平铺在棋盘表面）
function TextLabel({ text, position, cellSize }: {
  text: string;
  position: [number, number, number];
  cellSize: number;
}) {
  const texture = useMemo(() => createTextTexture(text), [text]);
  const s = cellSize * 0.55;

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[s, s]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

// 棋盘四边的坐标标签（字母 + 数字，印在木框上）
interface BoardCoordinateLabelsProps {
  size: number;
  cellSize?: number;
}

export function BoardCoordinateLabels({ size, cellSize = 1 }: BoardCoordinateLabelsProps) {
  const half = ((size - 1) * cellSize) / 2;
  const offset = half + cellSize * 0.7; // 木框加宽后靠外的位置，避免与棋子重叠
  const y = 0.02; // 抬高到面板之上，避免被木框顶面遮挡

  const labels: React.ReactNode[] = [];

  // 底部 + 顶部字母
  for (let i = 0; i < size; i++) {
    const x = -half + i * cellSize;
    const letter = COLUMNS[i];
    labels.push(
      <TextLabel key={`col-${i}`} text={letter} position={[x, y, offset]} cellSize={cellSize} />,
      <TextLabel key={`col-top-${i}`} text={letter} position={[x, y, -offset]} cellSize={cellSize} />,
    );
  }

  // 左侧 + 右侧数字
  for (let i = 0; i < size; i++) {
    const z = -half + i * cellSize;
    const num = String(size - i);
    labels.push(
      <TextLabel key={`row-${i}`} text={num} position={[-offset, y, z]} cellSize={cellSize} />,
      <TextLabel key={`row-right-${i}`} text={num} position={[offset, y, z]} cellSize={cellSize} />,
    );
  }

  return <group>{labels}</group>;
}
