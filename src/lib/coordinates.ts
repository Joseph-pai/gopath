// 围棋坐标转换工具
// 列 A-T 跳过 I，行 1-19 从下往上

const COLUMNS = 'ABCDEFGHJKLMNOPQRST'; // 跳过 I

// 数组坐标 (0-based) -> 显示坐标 (A-T, 1-N)
export function toDisplay(x: number, y: number, size: number): string {
  const col = COLUMNS[x] || `?`;
  const row = size - y;
  return `${col}${row}`;
}

// 显示坐标 -> 数组坐标
export function fromDisplay(coord: string, size: number): Point | null {
  const upper = coord.toUpperCase().trim();
  const match = upper.match(/^([A-HJ-T])(\d+)$/);
  if (!match) return null;
  
  const colChar = match[1];
  const rowNum = parseInt(match[2], 10);
  
  const x = COLUMNS.indexOf(colChar);
  const y = size - rowNum;
  
  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

// SGF 坐标 -> 数组坐标
// SGF: aa = (0,0) = A1, 从左上开始
export function fromSGF(sgfCoord: string, size: number): Point | null {
  if (sgfCoord.length !== 2) return null;
  const x = sgfCoord.charCodeAt(0) - 'a'.charCodeAt(0);
  const y = sgfCoord.charCodeAt(1) - 'a'.charCodeAt(1);
  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

// 数组坐标 -> SGF 坐标
export function toSGF(x: number, y: number): string {
  return String.fromCharCode('a'.charCodeAt(0) + x) + String.fromCharCode('a'.charCodeAt(0) + y);
}

// 获取星位坐标
export function getStarPoints(size: number): Point[] {
  const stars: Point[] = [];
  if (size === 9) {
    stars.push({ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 4 }, { x: 2, y: 6 }, { x: 6, y: 6 });
  } else if (size === 13) {
    stars.push(
      { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 6, y: 6 },
      { x: 3, y: 9 }, { x: 9, y: 9 }
    );
  } else {
    // 19路
    stars.push(
      { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
      { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
      { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
    );
  }
  return stars;
}

export interface Point {
  x: number;
  y: number;
}
