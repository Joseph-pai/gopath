// 围棋规则核心单元测试
import { describe, it, expect } from 'vitest';
import {
  createBoard,
  cloneBoard,
  getGroup,
  getLiberties,
  isSuicide,
  isKo,
  tryPlaceStone,
  scoreChinese,
  countStones,
} from './goRules';

describe('createBoard', () => {
  it('创建正确大小的空棋盘', () => {
    const board = createBoard(9);
    expect(board.length).toBe(9);
    expect(board[0].length).toBe(9);
    expect(board[4][4]).toBeNull();
  });

  it('支持不同路数', () => {
    expect(createBoard(9).length).toBe(9);
    expect(createBoard(13).length).toBe(13);
    expect(createBoard(19).length).toBe(19);
  });
});

describe('cloneBoard', () => {
  it('深拷贝后修改不影响原棋盘', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    const cloned = cloneBoard(board);
    cloned[0][0] = 'white';
    expect(board[0][0]).toBeNull();
    expect(cloned[4][4]).toBe('black');
  });
});

describe('getGroup & getLiberties', () => {
  it('中央单子有4气', () => {
    const board = createBoard(9);
    board[4][4] = 'black'; // y=4, x=4
    const liberties = getLiberties(board, 4, 4); // x=4, y=4
    expect(liberties.length).toBe(4);
  });

  it('边上单子有3气', () => {
    const board = createBoard(9);
    board[4][0] = 'black'; // y=4, x=0 (最左边)
    const liberties = getLiberties(board, 0, 4); // x=0, y=4
    expect(liberties.length).toBe(3);
  });

  it('角上单子有2气', () => {
    const board = createBoard(9);
    board[0][0] = 'black'; // y=0, x=0 (左上角)
    const liberties = getLiberties(board, 0, 0); // x=0, y=0
    expect(liberties.length).toBe(2);
  });

  it('相连的棋子共享气', () => {
    const board = createBoard(9);
    board[4][4] = 'black'; // y=4, x=4
    board[4][5] = 'black'; // y=4, x=5
    const group = getGroup(board, 5, 4); // x=5, y=4
    expect(group.stones.length).toBe(2);
    expect(group.color).toBe('black');
    // 两个相连棋子最多有 6 气
    expect(group.liberties.length).toBe(6);
  });
});

describe('tryPlaceStone', () => {
  it('正常落子成功', () => {
    const board = createBoard(9);
    const result = tryPlaceStone(board, 4, 4, 'black');
    expect(result.ok).toBe(true);
    expect(result.newBoard![4][4]).toBe('black');
  });

  it('不能落在已有棋子的位置', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    const result = tryPlaceStone(board, 4, 4, 'white');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('occupied');
  });

  it('不能自杀（禁入点）', () => {
    const board = createBoard(9);
    // 用4颗黑子围住中央一个位置，白子落那里就是禁入
    // 黑子: (3,4), (4,3), (5,4), (4,5) —— 围住 (4,4)
    board[4][3] = 'black'; // y=4, x=3  => x=3, y=4
    board[3][4] = 'black'; // y=3, x=4  => x=4, y=3
    board[4][5] = 'black'; // y=4, x=5  => x=5, y=4
    board[5][4] = 'black'; // y=5, x=4  => x=4, y=5
    // 白子落 (4,4) 即 x=4, y=4 => board[4][4]
    const result = tryPlaceStone(board, 4, 4, 'white');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('suicide');
  });

  it('可以提掉对方无气的棋子', () => {
    const board = createBoard(9);
    // 构造一个白子只剩1气的局面
    // 白子在 (4,4) = board[4][4]
    // 周围三面被黑包围，只剩右面 (5,4)
    board[4][4] = 'white';  // y=4, x=4 (中央白子)
    board[4][3] = 'black';  // 左
    board[3][4] = 'black';  // 上
    board[5][4] = 'black';  // 下
    // 右面空着，这是最后一气
    // 黑子落 (5,4)? 不对, (5,4)是 x=5, y=4，即 board[4][5]
    const result = tryPlaceStone(board, 5, 4, 'black'); // x=5, y=4 => board[4][5]
    expect(result.ok).toBe(true);
    expect(result.captured).toBeDefined();
    expect(result.captured!.length).toBe(1);
    // 被提的是 (4,4)
    expect(result.captured![0]).toEqual({ x: 4, y: 4 });
    // 新棋盘上 (4,4) 应该为空
    expect(result.newBoard![4][4]).toBeNull();
    // 且黑子 (5,4) 应该在
    expect(result.newBoard![4][5]).toBe('black');
  });

  it('可以提掉对方一整块棋', () => {
    const board = createBoard(9);
    // 两个相连白子被围住
    // 白子: (4,4), (5,4) = board[4][4], board[4][5]
    board[4][4] = 'white';
    board[4][5] = 'white';
    // 包围它们的黑子
    board[3][4] = 'black';  // 上 (x=4,y=3)
    board[3][5] = 'black';  // 上 (x=5,y=3)
    board[5][4] = 'black';  // 下 (x=4,y=5)
    board[5][5] = 'black';  // 下 (x=5,y=5)
    board[4][3] = 'black';  // 左 (x=3,y=4)
    // 右面空着 (x=6,y=4) => board[4][6]
    const result = tryPlaceStone(board, 6, 4, 'black'); // 落子 x=6, y=4
    expect(result.ok).toBe(true);
    expect(result.captured!.length).toBe(2); // 两个白子被提
  });
});

describe('isSuicide', () => {
  it('真禁入点返回 true', () => {
    const board = createBoard(9);
    // 黑子围住一个空位 (4,4)
    board[4][3] = 'black'; // x=3,y=4
    board[3][4] = 'black'; // x=4,y=3
    board[5][4] = 'black'; // x=5,y=4
    board[4][5] = 'black'; // x=4,y=5
    // 白子落 x=4,y=4 即 board[4][4]
    expect(isSuicide(board, 4, 4, 'white')).toBe(true);
  });

  it('能提子的位置不是禁入点', () => {
    const board = createBoard(9);
    // 白子只剩一气在 (5,4)
    board[4][4] = 'white';  // 白子
    board[4][3] = 'black';  // 左
    board[3][4] = 'black';  // 上
    board[5][4] = 'black';  // 下
    // 黑子落 (5,4)? 不对，黑子在 (5,4) 了
    // 最后一气是 (4,5) 即 x=5, y=4
    expect(isSuicide(board, 5, 4, 'black')).toBe(false);
  });
});

describe('scoreChinese', () => {
  it('简单数子', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    board[5][4] = 'white';
    
    const score = scoreChinese(board, [], 0);
    expect(score.black).toBeGreaterThanOrEqual(1);
    expect(score.white).toBeGreaterThanOrEqual(1);
  });

  it('贴目生效', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    const score = scoreChinese(board, [], 7.5);
    expect(score.komi).toBe(7.5);
  });
});

describe('countStones', () => {
  it('正确统计棋子数', () => {
    const board = createBoard(9);
    board[0][0] = 'black';
    board[4][4] = 'black';
    board[8][8] = 'white';
    
    const counts = countStones(board);
    expect(counts.black).toBe(2);
    expect(counts.white).toBe(1);
  });
});

describe('劫争检测 (isKo)', () => {
  it('相同棋盘判定为劫', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    board[4][5] = 'white';
    
    expect(isKo(board, board)).toBe(true);
  });

  it('不同棋盘不是劫', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    const board2 = cloneBoard(board);
    board2[0][0] = 'black';
    expect(isKo(board, board2)).toBe(false);
  });

  it('previousBoard为null时不是劫', () => {
    const board = createBoard(9);
    board[4][4] = 'black';
    expect(isKo(null, board)).toBe(false);
  });
});
