import { useMemo } from 'react';
import * as THREE from 'three';
import type { BoardSize } from '../types/go';
import { getStarPoints } from '../lib/coordinates';

interface BoardSurfaceProps {
  size: BoardSize;
  cellSize?: number;
}

export default function BoardSurface({ size, cellSize = 1 }: BoardSurfaceProps) {
  const boardSize = (size - 1) * cellSize;
  const half = boardSize / 2;

  // 生成网格线
  const gridLines = useMemo(() => {
    const lineMat = new THREE.LineBasicMaterial({ color: '#4a2c12' });
    const lines: React.ReactNode[] = [];

    for (let i = 0; i < size; i++) {
      const pos = -half + i * cellSize;
      // 横线 (X轴方向)
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, 0.01, pos),
        new THREE.Vector3(half, 0.01, pos),
      ]);
      lines.push(<lineSegments key={`h-${i}`} geometry={hGeo} material={lineMat} />);
      // 竖线 (Z轴方向)
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos, 0.01, -half),
        new THREE.Vector3(pos, 0.01, half),
      ]);
      lines.push(<lineSegments key={`v-${i}`} geometry={vGeo} material={lineMat} />);
    }
    return lines;
  }, [size, cellSize, half]);

  // 星位
  const starPoints = useMemo(() => {
    const positions = getStarPoints(size);
    return positions.map((pos, i) => {
      const x = -half + pos.x * cellSize;
      const z = -half + pos.y * cellSize;
      return (
        <mesh key={`star-${i}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#5a3a1a" />
        </mesh>
      );
    });
  }, [size, cellSize, half]);

  return (
    <group>
      {/* 木纹棋盘平面（旋转到水平 XZ 平面） */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[boardSize + 1, boardSize + 1]} />
        <meshStandardMaterial 
          color="#dcb279" 
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      
      {/* 棋盘边框（深原木色底座，加宽边缘用于印坐标，下沉形成木框托底） */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[boardSize + 2.0, 0.12, boardSize + 2.0]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      
      {/* 网格线 */}
      {gridLines}
      
      {/* 星位 */}
      {starPoints}
    </group>
  );
}
