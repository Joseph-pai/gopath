import { levels } from '../data/levels';
import { useProgress } from '../store/useProgress';

interface LevelMapProps {
  onSelectLevel: (levelId: number) => void;
}

export default function LevelMap({ onSelectLevel }: LevelMapProps) {
  const progress = useProgress();

  const getLevelStatus = (levelId: number): 'completed' | 'unlocked' | 'locked' => {
    if (progress.completedLevels.includes(levelId)) return 'completed';
    if (levelId >= progress.currentLevel) return 'unlocked';
    return 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'unlocked': return '▶';
      default: return '🔒';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'unlocked': return 'bg-amber-500 hover:bg-amber-600 cursor-pointer';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-amber-800 to-orange-800 text-white py-8 px-6 text-center shadow-xl">
        <h1 className="text-4xl font-bold mb-2">
          🎯 GoPath
        </h1>
        <p className="text-lg opacity-90">围棋十级路 · 从零到一的围棋教学之旅</p>
        <div className="mt-4 text-sm opacity-80">
          当前进度：Level {progress.currentLevel} · 已完成 {progress.completedLevels.length} 关
        </div>
      </header>

      {/* 十级地图 */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const status = getLevelStatus(level.id);
            const clickable = status !== 'locked';
            
            return (
              <div
                key={level.id}
                onClick={() => clickable && onSelectLevel(level.id)}
                className={`
                  relative rounded-2xl p-5 shadow-lg transition-all duration-300
                  border-2 ${status === 'completed' ? 'border-green-300 bg-green-50' : 
                           status === 'unlocked' ? 'border-amber-300 bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer' :
                           'border-gray-200 bg-gray-50 opacity-70'}
                `}
              >
                {/* 状态徽章 */}
                <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full ${getStatusColor(status)} text-white flex items-center justify-center text-sm shadow-lg font-bold`}>
                  {getStatusIcon(status)}
                </div>
                
                {/* Level 编号 */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-amber-800">{level.id}</span>
                  <span className="text-xs font-semibold text-gray-500">级</span>
                </div>
                
                {/* 标题 */}
                <h3 className={`text-lg font-bold ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {level.title.replace(/^第.+级 · /, '')}
                </h3>
                
                <p className={`text-sm mt-1 ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {level.subtitle}
                </p>
                
                {/* 类型标签 */}
                <div className="mt-3">
                  <span className={`
                    inline-block text-xs px-2 py-1 rounded-full font-medium
                    ${level.lessonType === 'tutorial' ? 'bg-blue-100 text-blue-700' :
                      level.lessonType === 'guided-game' ? 'bg-purple-100 text-purple-700' :
                      level.lessonType === 'tactics' ? 'bg-orange-100 text-orange-700' :
                      'bg-pink-100 text-pink-700'}
                  `}>
                    {level.lessonType === 'tutorial' ? '📖 入门教学' :
                     level.lessonType === 'guided-game' ? '♟️ 引导对局' :
                     level.lessonType === 'tactics' ? '⚔️ 战术练习' :
                     '🎬 名家复盘'}
                  </span>
                </div>
                
                {/* 棋盘路数提示 */}
                <div className={`text-xs mt-2 ${status === 'locked' ? 'text-gray-300' : 'text-gray-400'}`}>
                  {level.boardSize}路棋盘
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 自由对弈入口 */}
        <div className="mt-10">
          <button 
            onClick={() => alert('自由对弈模式将在阶段5实现！')}
            className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            ♟️ 进入自由对弈模式
          </button>
        </div>
        
        {/* 重置进度（隐藏在角落，方便测试） */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (confirm('确定要重置所有进度吗？')) {
                progress.resetProgress();
                window.location.reload();
              }
            }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            重置进度
          </button>
        </div>
      </main>
      
      {/* 底部说明 */}
      <footer className="text-center text-gray-400 text-xs pb-8">
        💡 Level 10 默认解锁，完成当前关卡后自动解锁下一关
      </footer>
    </div>
  );
}
