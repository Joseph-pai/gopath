// 围棋核心类型定义

export type Color = 'black' | 'white';
export type Point = { x: number; y: number };
export type Board = (Color | null)[][];

export type BoardSize = 9 | 13 | 19;

// 落子结果
export interface PlaceResult {
  ok: boolean;
  newBoard?: Board;
  captured?: Point[];
  reason?: 'occupied' | 'suicide' | 'ko';
}

// 棋块信息
export interface Group {
  stones: Point[];
  liberties: Point[];
  color: Color;
}

// 数子结果
export interface ScoreResult {
  black: number;
  white: number;
  winner: Color | 'draw';
  komi: number;
  blackStones: number;
  whiteStones: number;
  blackTerritory: number;
  whiteTerritory: number;
}

// 领地信息（一块被单色棋包围的空点区域）
export interface TerritoryRegion {
  points: Point[];
  color: Color;
  index: number;  // 编号（1-based，按棋盘扫描顺序）
  center: Point;  // 中心点（用于在棋盘上显示编号）
}

// 游戏模式
export type BoardMode = 'lesson' | 'play' | 'review';

// 落子历史记录
export interface Move {
  x: number;
  y: number;
  color: Color;
  captured: Point[];
}

// 高亮类型
export type HighlightType = 'liberty' | 'recommend' | 'lastMove' | 'forbidden' | 'territory';

// 高亮标记
export interface Highlight {
  point: Point;
  type: HighlightType;
}
