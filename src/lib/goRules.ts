// 围棋规则核心引擎
// 实现：气、提子、禁入点、劫争、中国规则数子

import type { Color, Board, Point, PlaceResult, Group, ScoreResult } from '../types/go';

// 创建空棋盘
export function createBoard(size: number): Board {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

// 深拷贝棋盘
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

// 获取相邻点（上下左右）
export function getNeighbors(x: number, y: number, size: number): Point[] {
  const neighbors: Point[] = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < size - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < size - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
}

// 获取一个棋子所在棋块的所有棋子和气
export function getGroup(board: Board, x: number, y: number): Group {
  const size = board.length;
  const color = board[y][x];
  
  if (!color) {
    return { stones: [], liberties: [], color: 'black' as Color };
  }
  
  const visited = new Set<string>();
  const stones: Point[] = [];
  const libertySet = new Set<string>();
  const liberties: Point[] = [];
  
  function dfs(px: number, py: number) {
    const key = `${px},${py}`;
    if (visited.has(key)) return;
    visited.add(key);
    
    const c = board[py][px];
    if (c === color) {
      stones.push({ x: px, y: py });
      for (const n of getNeighbors(px, py, size)) {
        dfs(n.x, n.y);
      }
    } else if (c === null) {
      if (!libertySet.has(key)) {
        libertySet.add(key);
        liberties.push({ x: px, y: py });
      }
    }
    // 敌方颜色不处理
  }
  
  dfs(x, y);
  
  return { stones, liberties, color };
}

// 获取一个位置的气（如果那里有棋子）
export function getLiberties(board: Board, x: number, y: number): Point[] {
  const group = getGroup(board, x, y);
  return group.liberties;
}

// 统计棋块数量
export function countLiberties(board: Board, x: number, y: number): number {
  return getLiberties(board, x, y).length;
}

// 检查是否自杀（禁入点：落子后自己无气且没提对方）
export function isSuicide(board: Board, x: number, y: number, color: Color): boolean {
  if (board[y][x] !== null) return false;
  
  const size = board.length;
  const testBoard = cloneBoard(board);
  testBoard[y][x] = color;
  
  // 先检查能否提对方子
  const opponent: Color = color === 'black' ? 'white' : 'black';
  for (const n of getNeighbors(x, y, size)) {
    if (testBoard[n.y][n.x] === opponent) {
      const oppGroup = getGroup(testBoard, n.x, n.y);
      if (oppGroup.liberties.length === 0) {
        return false; // 能提对方，不是自杀
      }
    }
  }
  
  // 检查自己落子后是否有气
  const ownGroup = getGroup(testBoard, x, y);
  return ownGroup.liberties.length === 0;
}

// 检查劫争（简单版本：记录上一手棋盘快照）
// 实际使用时需要保存 previousBoard 来比较
export function isKo(previousBoard: Board | null, nextBoard: Board): boolean {
  if (!previousBoard) return false;
  
  const size = previousBoard.length;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (previousBoard[y][x] !== nextBoard[y][x]) {
        return false;
      }
    }
  }
  return true;
}

// 尝试落子
export function tryPlaceStone(
  board: Board, 
  x: number, 
  y: number, 
  color: Color,
  previousBoard: Board | null = null
): PlaceResult {
  const size = board.length;
  
  // 检查越界
  if (x < 0 || x >= size || y < 0 || y >= size) {
    return { ok: false, reason: 'occupied' };
  }
  
  // 检查是否已有棋子
  if (board[y][x] !== null) {
    return { ok: false, reason: 'occupied' };
  }
  
  // 检查是否自杀
  if (isSuicide(board, x, y, color)) {
    return { ok: false, reason: 'suicide' };
  }
  
  // 落子
  const newBoard = cloneBoard(board);
  newBoard[y][x] = color;
  
  // 提走对方无气的棋块
  const opponent: Color = color === 'black' ? 'white' : 'black';
  const captured: Point[] = [];
  
  for (const n of getNeighbors(x, y, size)) {
    if (newBoard[n.y][n.x] === opponent) {
      const oppGroup = getGroup(newBoard, n.x, n.y);
      if (oppGroup.liberties.length === 0) {
        // 提子
        for (const stone of oppGroup.stones) {
          newBoard[stone.y][stone.x] = null;
          captured.push(stone);
        }
      }
    }
  }
  
  // 检查劫争
  if (isKo(previousBoard, newBoard)) {
    return { ok: false, reason: 'ko' };
  }
  
  return { ok: true, newBoard, captured };
}

// 中国规则数子
export function scoreChinese(
  board: Board, 
  deadStones: Point[] = [], 
  komi: number = 7.5
): ScoreResult {
  const size = board.length;
  
  // 移除死子
  const scoreBoard = cloneBoard(board);
  
  for (const p of deadStones) {
    scoreBoard[p.y][p.x] = null;
  }
  
  // 统计活子数
  let blackStones = 0;
  let whiteStones = 0;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (scoreBoard[y][x] === 'black') blackStones++;
      else if (scoreBoard[y][x] === 'white') whiteStones++;
    }
  }
  
  // 计算领地（被单色活棋完全包围的空点）
  let blackTerritory = 0;
  let whiteTerritory = 0;
  const visited = new Set<string>();
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (scoreBoard[y][x] === null && !visited.has(`${x},${y}`)) {
        // BFS 找这块空点
        const region: Point[] = [];
        const borders = new Set<Color>();
        const queue: Point[] = [{ x, y }];
        visited.add(`${x},${y}`);
        
        while (queue.length > 0) {
          const p = queue.shift()!;
          region.push(p);
          
          for (const n of getNeighbors(p.x, p.y, size)) {
            const key = `${n.x},${n.y}`;
            const c = scoreBoard[n.y][n.x];
            if (c === null) {
              if (!visited.has(key)) {
                visited.add(key);
                queue.push(n);
              }
            } else {
              borders.add(c);
            }
          }
        }
        
        // 只被一种颜色包围才算领地
        if (borders.size === 1) {
          if (borders.has('black')) {
            blackTerritory += region.length;
          } else if (borders.has('white')) {
            whiteTerritory += region.length;
          }
        }
      }
    }
  }
  
  // 中国规则：活子 + 领地
  const blackTotal = blackStones + blackTerritory;
  const whiteTotal = whiteStones + whiteTerritory + komi;
  
  let winner: Color | 'draw' = 'draw';
  if (blackTotal > whiteTotal) winner = 'black';
  else if (whiteTotal > blackTotal) winner = 'white';
  
  return {
    black: blackTotal,
    white: whiteTotal,
    winner,
    komi,
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
  };
}

// 简化数子（只统计棋子数，不计算领地）- 用于教学演示
export function countStones(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  const size = board.length;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === 'black') black++;
      else if (board[y][x] === 'white') white++;
    }
  }
  
  return { black, white };
}

// 分析棋盘上所有棋块（连通块），返回每块及其气
export function analyzeGroups(board: Board): Group[] {
  const size = board.length;
  const visited = new Set<string>();
  const groups: Group[] = [];
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`;
      if (board[y][x] && !visited.has(key)) {
        const group = getGroup(board, x, y);
        for (const s of group.stones) {
          visited.add(`${s.x},${s.y}`);
        }
        groups.push(group);
      }
    }
  }
  return groups;
}
