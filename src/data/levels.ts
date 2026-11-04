import type { Level } from '../types/lesson';
import { createBoard } from '../lib/goRules';

// Level 10：完全初学者——棋盘、落子、气、提子、禁入点、打劫、胜负
export const level10: Level = {
  id: 10,
  title: '第十级 · 初识围棋',
  subtitle: '从认识棋盘开始',
  description: '七步学会围棋最基本的概念：棋盘、落子、气、提子、禁入点、打劫和胜负计算。',
  boardSize: 9,
  lessonType: 'tutorial',
  passCondition: '完成全部7个步骤',
  steps: [
    {
      id: '10.1',
      title: '棋盘与交叉点',
      content: '围棋的棋子落在"线与线的交叉点"上，而不是格子里。9路棋盘有81个交叉点。棋盘上那5个加粗的圆点叫做"星位"，是定位的参照点。现在星位已用金色圆环标出。',
      task: '点击任意一个金色星位，落下一颗黑子。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      highlights: [
        { point: { x: 2, y: 2 }, type: 'recommend' },
        { point: { x: 6, y: 2 }, type: 'recommend' },
        { point: { x: 4, y: 4 }, type: 'recommend' },
        { point: { x: 2, y: 6 }, type: 'recommend' },
        { point: { x: 6, y: 6 }, type: 'recommend' },
      ],
      allowedMoves: [
        { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 4 },
        { x: 2, y: 6 }, { x: 6, y: 6 },
      ],
      feedback: '很好！你认识了星位——棋盘中央和四角附近的定位圆点。',
    },
    {
      id: '10.2',
      title: '落子规则',
      content: '黑白双方轮流下棋，黑方先行。棋子落在空交叉点上，落下后就不能再移动！现在由你落第一手黑子，落子后轮到白方（也由你代下）。',
      task: '点击任意空交叉点落黑子，感受"落子无悔"。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      feedback: '就是这样！黑先白后，交替落子。',
    },
    {
      id: '10.3',
      title: '什么是"气"？',
      content: '"气"是一颗棋子上下左右相邻的空交叉点。落子后，绿色圆环会实时标出每块棋的气，左上角面板显示每块棋的气数。试试在不同位置落子：中央4气、边上3气、角上2气。',
      task: '在棋盘不同位置自由落子（中央、边、角），观察每块棋的气数与绿色圆环如何变化。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      showAllLiberties: true,
      feedback: '很好！记住：中央4气、边上3气、角上2气，这是围棋最基本的规律。',
    },
    {
      id: '10.4',
      title: '提子——吃掉对方的棋',
      content: '当一块棋的所有气都被对方占满，这块棋就被"提"走了。这块白子已被黑子围住三面，只剩最后一口气（绿色圆环标出）。落黑子把白子提掉！',
      task: '落黑子在绿色圆环处，提掉这块白子。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      setupBoard: (() => {
        const board = createBoard(9);
        board[4][3] = 'white';  // 白子 x=3, y=4
        board[3][3] = 'black';  // 上 x=3, y=3
        board[4][2] = 'black';  // 左 x=2, y=4
        board[5][3] = 'black';  // 下 x=3, y=5
        return board;
      })(),
      showLiberties: [{ x: 4, y: 4 }], // 最后一气
      allowedMoves: [{ x: 4, y: 4 }],
      expectedMove: { x: 4, y: 4 },
      feedback: '太棒了！你提掉了白子——气被占满的棋子会被吃掉。',
    },
    {
      id: '10.5',
      title: '禁入点',
      content: '有些交叉点看起来能落子，其实不能：如果落子后自己立刻没有气、又提不掉对方的子，这就是"禁入点"。中央那个红色叉号的位置被黑子完全包围，白子落进去会立刻无气。',
      task: '试试点击红色叉号的位置落白子，观察系统提示。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'white',
      setupBoard: (() => {
        const board = createBoard(9);
        // 四颗黑子围住中央 (4,4)，形成禁入点
        board[4][3] = 'black'; // 左 x=3, y=4
        board[4][5] = 'black'; // 右 x=5, y=4
        board[3][4] = 'black'; // 上 x=4, y=3
        board[5][4] = 'black'; // 下 x=4, y=5
        return board;
      })(),
      forbiddenPoints: [{ x: 4, y: 4 }],
      feedback: '看到了吗？落在这里白子立刻无气、又提不掉黑子，这就是"禁入点"，规则禁止落子。',
    },
    {
      id: '10.6',
      title: '打劫',
      content: '有一种特殊情况叫"打劫"：你提掉对方一颗子后，落下的那颗子自己也只剩一口气，对方不能立刻提回来，必须先到别处走一步（找"劫材"）。金色圆环标记的位置就是劫点，落黑子提掉白子。',
      task: '落黑子在金色圆环处，提掉白子，理解"劫"。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      setupBoard: (() => {
        const board = createBoard(9);
        // 标准劫形：黑落 (3,2) 提白 (3,3)，提后黑子只剩 (3,3) 一气
        board[1][3] = 'white'; // 白 x=3, y=1
        board[2][2] = 'white'; // 白 x=2, y=2
        board[2][4] = 'white'; // 白 x=4, y=2
        board[3][2] = 'black'; // 黑 x=2, y=3
        board[3][3] = 'white'; // 白 x=3, y=3 (将被提)
        board[3][4] = 'black'; // 黑 x=4, y=3
        board[4][3] = 'black'; // 黑 x=3, y=4
        return board;
      })(),
      highlights: [{ point: { x: 3, y: 2 }, type: 'recommend' }],
      allowedMoves: [{ x: 3, y: 2 }],
      expectedMove: { x: 3, y: 2 },
      feedback: '你提掉了白子，但落下的黑子也只剩一口气——对方不能立刻提回，这就是"打劫"。',
    },
    {
      id: '10.7',
      title: '如何计算胜负',
      content: '围棋用"中国规则"数子：终局后，自己的棋子数 + 围住的空点（领地）加起来多的一方获胜。白方通常有约7.5目的"贴目"补偿。下面是终局示例，你继续落子试试，看看分数如何变化。',
      task: '在棋盘上继续落子，观察左上角"数子得分"面板：棋子 + 领地 = 总分，每落一子分数都会实时变化。',
      showCoordinates: true,
      setupBoardSize: 9,
      startPlayer: 'black',
      setupBoard: (() => {
        const board = createBoard(9);
        // 左上黑棋小地盘，右下白棋小地盘
        board[1][1] = 'black';
        board[1][2] = 'black';
        board[2][1] = 'black';
        board[7][6] = 'white';
        board[7][7] = 'white';
        board[6][7] = 'white';
        return board;
      })(),
      feedback: '恭喜！你已经掌握围棋最基本的概念，可以进入下一级实战了。',
    },
  ],
};

// Level 列表 - 先只完整定义 Level 10，其他为占位
export const levels: Level[] = [
  level10,
  {
    id: 9,
    title: '第九级 · 第一盘完整棋',
    subtitle: '9路引导对局',
    description: '从头到尾完成你的第一盘围棋！系统会教你每一步该怎么下。',
    boardSize: 9,
    lessonType: 'guided-game',
    passCondition: '走完20-30手引导对局并理解每步解释',
    steps: [],
  },
  {
    id: 8,
    title: '第八级 · 吃子与连接',
    subtitle: '双叫吃、征子、枷、接不归',
    description: '学习基本的吃子战术：双叫吃、征子、枷、倒扑、接不归，以及什么时候该连接、什么时候该分断。',
    boardSize: 9,
    lessonType: 'tactics',
    passCondition: '完成所有战术练习',
    steps: [],
  },
  {
    id: 7,
    title: '第七级 · 死活与布局',
    subtitle: '做活、破眼、布局三原则',
    description: '学习真眼假眼、两只眼活棋、基本死活型，以及布局三原则：金角银边草肚皮。',
    boardSize: 9,
    lessonType: 'tactics',
    passCondition: '完成死活练习和布局对比',
    steps: [],
  },
  {
    id: 6,
    title: '第六级 · 本因坊秀策',
    subtitle: '坚实布局与秀策流',
    description: '学习本因坊秀策的经典布局：小目、坚实拆边、不急不躁、厚实推进。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
  {
    id: 5,
    title: '第五级 · 吴清源',
    subtitle: '新布局与全局平衡',
    description: '吴清源：全局速度、模样与实地的平衡、不拘泥局部。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
  {
    id: 4,
    title: '第四级 · 木谷实',
    subtitle: '厚味与实地',
    description: '木谷实：厚势价值、低位与高位、实地根基、后发制人。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
  {
    id: 3,
    title: '第三级 · 坂田荣男',
    subtitle: '手筋与治孤',
    description: '坂田荣男：手筋、治孤次序、先手手段、敏锐的局部计算。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
  {
    id: 2,
    title: '第二级 · 李昌镐',
    subtitle: '厚实均衡与官子',
    description: '李昌镐：厚味转化、官子价值、避免无理、少失误赢棋。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
  {
    id: 1,
    title: '第一级 · 灵活战斗',
    subtitle: 'AI时代的胜负手',
    description: '柯洁/李世石：战斗中的计算、全局转换、关键时刻的胜负手判断。',
    boardSize: 19,
    lessonType: 'review',
    passCondition: '完成SGF复盘和关键问题',
    steps: [],
  },
];

export function getLevel(id: number): Level | undefined {
  return levels.find(l => l.id === id);
}
