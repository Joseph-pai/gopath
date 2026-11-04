import type { Point, HighlightType } from '../types/go';

interface HighlightProps {
  point: Point;
  type: HighlightType;
  cellSize: number;
  halfBoard: number;
}

export default function Highlight({ point, type, cellSize, halfBoard }: HighlightProps) {
  const worldX = -halfBoard + point.x * cellSize;
  const worldZ = -halfBoard + point.y * cellSize;
  
  if (type === 'liberty') {
    // 绿色圆环 - 气
    return (
      <mesh position={[worldX, 0.15, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.33, 24]} />
        <meshBasicMaterial color="#22cc44" transparent opacity={0.6} />
      </mesh>
    );
  }
  
  if (type === 'recommend') {
    // 金色脉冲圆环 - 推荐点
    return (
      <mesh position={[worldX, 0.15, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial 
          color="#ffcc00" 
          transparent 
          opacity={0.8}
        />
      </mesh>
    );
  }
  
  if (type === 'forbidden') {
    // 红色叉号 - 禁入点（平铺在棋盘上）
    const arm = 0.3;
    return (
      <group position={[worldX, 0.12, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[arm * 2, 0.1]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.95} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[arm * 2, 0.1]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.95} />
        </mesh>
      </group>
    );
  }
  
  return null;
}
