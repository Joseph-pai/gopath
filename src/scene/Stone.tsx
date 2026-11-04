import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Color, Point } from '../types/go';

interface StoneProps {
  x: number;
  y: number;
  color: Color;
  cellSize: number;
  halfBoard: number;
  isLastMove?: boolean;
  animating?: boolean;
  onAnimationComplete?: () => void;
}

export default function Stone({ 
  x, y, color, cellSize, halfBoard, 
  isLastMove = false, 
  animating = false,
  onAnimationComplete 
}: StoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startY = animating ? 0.8 : 0;
  const targetY = 0.06;
  
  // 计算世界坐标
  const worldX = -halfBoard + x * cellSize;
  const worldZ = -halfBoard + y * cellSize;
  
  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    
    if (animating && meshRef.current.position.y < targetY - 0.01) {
      meshRef.current.position.y = Math.min(
        targetY,
        meshRef.current.position.y + delta * 4
      );
      if (meshRef.current.position.y >= targetY - 0.01) {
        onAnimationComplete?.();
      }
    }
  });

  const isBlack = color === 'black';
  
  return (
    <group position={[worldX, 0, worldZ]}>
      <mesh 
        ref={meshRef} 
        position={[0, startY, 0]} 
        castShadow 
        receiveShadow
      >
        <cylinderGeometry args={[0.42, 0.42, 0.12, 32]} />
        <meshStandardMaterial
          color={isBlack ? '#1a1a1a' : '#f5f5f0'}
          roughness={isBlack ? 0.3 : 0.2}
          metalness={isBlack ? 0.1 : 0.05}
          emissive={isBlack ? '#000000' : '#111111'}
          emissiveIntensity={isBlack ? 0 : 0.05}
        />
      </mesh>
      
      {/* 最后一手红圈标记 */}
      {isLastMove && (
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.58, 32]} />
          <meshBasicMaterial color="#ff3333" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// 提子时的缩放消失动画
interface CapturedStoneProps {
  point: Point;
  cellSize: number;
  halfBoard: number;
  color: Color;
  onComplete: () => void;
}

export function CapturedStone({ point, cellSize, halfBoard, color, onComplete }: CapturedStoneProps) {
  const ref = useRef<THREE.Mesh>(null);
  const startTime = useRef<number>(Date.now());
  
  useFrame(() => {
    if (!ref.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(1, elapsed / 0.25);
    
    // 缩放至0
    const scale = 1 - progress;
    ref.current.scale.setScalar(Math.max(0.01, scale));
    
    if (progress >= 1) {
      onComplete();
    }
  });
  
  return (
    <mesh 
      ref={ref} 
      position={[-halfBoard + point.x * cellSize, 0.06, -halfBoard + point.y * cellSize]}
    >
      <cylinderGeometry args={[0.42, 0.42, 0.12, 32]} />
      <meshStandardMaterial
        color={color === 'black' ? '#1a1a1a' : '#f5f5f0'}
        roughness={0.3}
      />
    </mesh>
  );
}
