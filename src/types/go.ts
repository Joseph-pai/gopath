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
