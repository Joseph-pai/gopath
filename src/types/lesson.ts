import type { Point, Board, BoardSize, HighlightType, Color } from './go';

// 教学步骤类型
export interface LessonStep {
  id: string;
  title: string;
  content: string;
  task?: string;
  setupBoard?: Board;
  setupBoardSize?: BoardSize;
  showCoordinates?: boolean;
  showLiberties?: Point[];
  highlights?: { point: Point; type: HighlightType }[];
  forbiddenPoints?: Point[];
  allowedMoves?: Point[];
  expectedMove?: Point;
  startPlayer?: Color;      // 该步骤起始执子方
  feedback?: string;        // 任务完成后的反馈提示
}

export interface LessonAPI {
  board: Board;
  setBoard: (board: Board) => void;
  highlightPoints: (points: Point[], type: HighlightType) => void;
  clearHighlights: () => void;
  showMessage: (msg: string) => void;
  setTaskCompleted: () => void;
}

// 关卡类型
export interface Level {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  boardSize: BoardSize;
  lessonType: 'tutorial' | 'guided-game' | 'tactics' | 'review';
  passCondition: string;
  steps: LessonStep[];
}
