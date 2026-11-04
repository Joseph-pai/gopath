import { useState, useCallback, useMemo } from 'react';
import GoScene from './scene/GoScene';
import LessonPanel from './components/LessonPanel';
import LevelMap from './components/LevelMap';
import { createBoard, scoreChinese } from './lib/goRules';
import { getLevel } from './data/levels';
import { arrayToDisplay } from './scene/BoardCoords';
import { useProgress } from './store/useProgress';
import type { Board, Color, BoardSize, Move, HighlightType } from './types/go';

type ViewMode = 'home' | 'lesson' | 'play';

export default function App() {
  // ========== 所有 hooks 必须在最顶层，顺序固定 ==========
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentLevelId, setCurrentLevelId] = useState<number>(10);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [board, setBoard] = useState<Board>(() => createBoard(9));
  const [currentPlayer, setCurrentPlayer] = useState<Color>('black');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [boardSize, setBoardSize] = useState<BoardSize>(9);
  const [hoverCoord, setHoverCoord] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  
  const progress = useProgress();
  const currentLevel = getLevel(currentLevelId);
  const currentStep = currentLevel?.steps[currentStepIndex];

  // useCallback 全部在条件 return 之前
  const enterLevel = useCallback((levelId: number) => {
    const level = getLevel(levelId);
    if (!level) return;
    setCurrentLevelId(levelId);
    setCurrentStepIndex(0);
    setBoard(createBoard(level.boardSize));
    setBoardSize(level.boardSize);
    setCurrentPlayer('black');
    setMoveHistory([]);
    setViewMode('lesson');
  }, []);

  const handleStepChange = useCallback((index: number) => {
    const level = getLevel(currentLevelId);
    if (!level) return;
    setCurrentStepIndex(index);
    const step = level.steps[index];
    if (step.setupBoard) {
      setBoard(step.setupBoard.map(row => [...row]));
    } else {
      setBoard(createBoard(step.setupBoardSize || level.boardSize));
    }
    setCurrentPlayer(step.startPlayer || 'black');
    setMoveHistory([]);
    setFeedback('');
  }, [currentLevelId]);

  const handleRestartLesson = useCallback(() => {
    handleStepChange(currentStepIndex);
  }, [currentStepIndex, handleStepChange]);

  const goHome = useCallback(() => {
    setViewMode('home');
  }, []);

  const handleCompleteLastStep = useCallback(() => {
    if (currentLevelId >= 1 && currentLevelId <= 10) {
      progress.completeLevel(currentLevelId);
      progress.setStepIndex(currentLevelId, currentStepIndex);
    }
  }, [currentLevelId, currentStepIndex, progress]);

  const handleLevelPanelFinish = useCallback(() => {
    handleCompleteLastStep();
  }, [handleCompleteLastStep]);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  }, []);

  const handlePlaceStoneCheck = useCallback((x: number, y: number) => {
    const level = getLevel(currentLevelId);
    if (!level || viewMode !== 'lesson') return;
    const step = level.steps[currentStepIndex];
    if (!step) return;
    if (step.expectedMove && step.expectedMove.x === x && step.expectedMove.y === y) {
      if (step.feedback) showFeedback(step.feedback);
    }
  }, [currentLevelId, currentStepIndex, viewMode, showFeedback]);

  const handleInvalidMove = useCallback((x: number, y: number, reason: string) => {
    const level = getLevel(currentLevelId);
    if (!level) return;
    const step = level.steps[currentStepIndex];
    if (!step) return;
    // 禁入点教学：用户尝试落禁入点（suicide）即完成体验
    if (step.forbiddenPoints && reason === 'suicide') {
      const isForbidden = step.forbiddenPoints.some(p => p.x === x && p.y === y);
      if (isForbidden && step.feedback) showFeedback(step.feedback);
    }
  }, [currentLevelId, currentStepIndex, showFeedback]);

  // useMemo 全部在条件 return 之前
  const stoneCounts = useMemo(() => {
    let black = 0;
    let white = 0;
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        if (board[y][x] === 'black') black++;
        else if (board[y][x] === 'white') white++;
      }
    }
    return { black, white };
  }, [board, boardSize]);

  const capturedCounts = useMemo(() => {
    let blackCap = 0;
    let whiteCap = 0;
    for (const m of moveHistory) {
      if (m.color === 'black') blackCap += m.captured.length;
      else whiteCap += m.captured.length;
    }
    return { blackCap, whiteCap };
  }, [moveHistory]);

  // 合并教学高亮：推荐点 + 禁入点（红色叉号）
  const lessonHighlights = useMemo(() => {
    if (!currentStep) return [];
    const hs: { point: { x: number; y: number }; type: HighlightType }[] = [...(currentStep.highlights || [])];
    for (const p of currentStep.forbiddenPoints || []) {
      hs.push({ point: p, type: 'forbidden' });
    }
    return hs;
  }, [currentStep]);

  // 实时数子得分（棋子 + 领地，白方含贴目）
  const score = useMemo(() => scoreChinese(board), [board]);

  // ========== 条件渲染在所有 hooks 之后 ==========
  if (viewMode === 'home') {
    return <LevelMap onSelectLevel={enterLevel} />;
  }

  // lesson 视图
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
      <header className="bg-amber-800 text-white px-4 py-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goHome}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            ← 返回地图
          </button>
          <h1 className="text-lg font-bold hidden sm:block">🎯 GoPath · Level {currentLevelId}</h1>
        </div>
        <div className="text-sm opacity-80 hidden md:block truncate max-w-xs">
          {currentStep?.title}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="relative bg-stone-100 shrink-0 h-[42vh] min-h-[280px] lg:h-auto lg:flex-1 lg:shrink lg:min-h-0">
          <GoScene
            boardSize={boardSize}
            board={board}
            setBoard={setBoard}
            currentPlayer={currentPlayer}
            setCurrentPlayer={setCurrentPlayer}
            moveHistory={moveHistory}
            setMoveHistory={setMoveHistory}
            boardMode="lesson"
            allowedMoves={currentStep?.allowedMoves}
            showLiberties={currentStep?.showLiberties}
            showHighlights={lessonHighlights}
            onPlaceStone={(x, y) => {
              handlePlaceStoneCheck(x, y);
              const display = arrayToDisplay(x, y, boardSize);
              setHoverCoord(display);
              setTimeout(() => setHoverCoord(''), 1500);
            }}
            onInvalidMove={handleInvalidMove}
          />
          
          {hoverCoord && (
            <div className="absolute bottom-4 left-4 bg-amber-800 text-white px-3 py-1.5 rounded-lg shadow-lg font-mono text-sm">
              📍 {hoverCoord}
            </div>
          )}
          
          {feedback && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium max-w-md text-center animate-bounce">
              ✅ {feedback}
            </div>
          )}
          
          {currentStep?.id === '10.7' ? (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg px-4 py-3 shadow-lg text-sm min-w-[220px]">
              <div className="font-bold text-amber-900 mb-2">📊 数子得分</div>
              <div className="text-gray-800 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span>⚫ 黑方</span>
                  <span className="font-mono text-xs">
                    子 {score.blackStones} + 地 {score.blackTerritory} = <span className="font-bold text-base">{score.black}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>⚪ 白方</span>
                  <span className="font-mono text-xs">
                    子 {score.whiteStones} + 地 {score.whiteTerritory} + 贴 {score.komi} = <span className="font-bold text-base">{score.white}</span>
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 font-semibold text-sm">
                {score.winner === 'draw' ? (
                  <span className="text-gray-500">当前平局</span>
                ) : score.winner === 'black' ? (
                  <span className="text-gray-900">⚫ 黑方领先 {score.black - score.white} 分</span>
                ) : (
                  <span className="text-gray-900">⚪ 白方领先 {score.white - score.black} 分</span>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-xs text-gray-600">
              <div>⚫ 黑子: {stoneCounts.black} (提 {capturedCounts.blackCap})</div>
              <div>⚪ 白子: {stoneCounts.white} (提 {capturedCounts.whiteCap})</div>
              <div className="mt-1 font-semibold">当前: {currentPlayer === 'black' ? '黑子' : '白子'} 落子</div>
            </div>
          )}
        </div>

        {currentLevel && (
          <div className="flex-1 lg:flex-initial lg:w-80 min-h-0 flex flex-col">
            <LessonPanel
              level={currentLevel}
              currentStepIndex={currentStepIndex}
              onStepChange={handleStepChange}
              onRestartLesson={handleRestartLesson}
              onCompleteStep={handleLevelPanelFinish}
            />
          </div>
        )}
      </main>

      <footer className="bg-stone-800 text-stone-300 text-center py-2 text-xs">
        💡 轻触棋盘落子 · 单指拖拽旋转 · 双指缩放/平移
      </footer>
    </div>
  );
}
