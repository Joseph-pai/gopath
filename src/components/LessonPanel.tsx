import { useState } from 'react';
import type { Level, LessonStep } from '../types/lesson';

interface LessonPanelProps {
  level: Level;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onRestartLesson: () => void;
  onCompleteStep?: (step: LessonStep) => void;
}

export default function LessonPanel({
  level,
  currentStepIndex,
  onStepChange,
  onRestartLesson,
}: LessonPanelProps) {
  const currentStep = level.steps[currentStepIndex];
  const [taskDone, setTaskDone] = useState(false);
  
  if (!currentStep) return null;
  
  const isLastStep = currentStepIndex >= level.steps.length - 1;
  const progressPercent = ((currentStepIndex + 1) / level.steps.length) * 100;

  return (
    <div className="w-full lg:w-80 bg-white/90 backdrop-blur shadow-xl flex flex-col flex-1 min-h-0 h-full">
      {/* 关卡标题 */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-white p-5">
        <div className="text-xs opacity-80">LEVEL {level.id}</div>
        <h2 className="text-xl font-bold mt-1">{level.title}</h2>
        <p className="text-sm opacity-80 mt-1">{level.subtitle}</p>
        
        {/* 进度条 */}
        <div className="mt-3 h-2 bg-amber-900/40 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs mt-2 opacity-80">
          步骤 {currentStepIndex + 1} / {level.steps.length}
        </div>
      </div>
      
      {/* 步骤导航 */}
      <div className="px-4 py-3 border-b bg-amber-50/50">
        <div className="flex gap-1 overflow-x-auto">
          {level.steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => onStepChange(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
                i === currentStepIndex
                  ? 'bg-amber-600 text-white shadow-md scale-110'
                  : i < currentStepIndex
                  ? 'bg-amber-400 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.id.split('.')[1]}
            </button>
          ))}
        </div>
      </div>
      
      {/* 教学内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* 步骤标题 */}
        <div>
          <div className="text-xs text-amber-600 font-semibold mb-1">STEP {currentStep.id}</div>
          <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
        </div>
        
        {/* 内容讲解 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-gray-700 leading-relaxed text-sm">
            {currentStep.content}
          </p>
        </div>
        
        {/* 任务 */}
        {currentStep.task && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <div className="text-xs font-semibold text-blue-600 mb-1">你的任务</div>
                <p className="text-gray-700 text-sm">{currentStep.task}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 小贴士 */}
        <div className="text-xs text-gray-400 italic border-t pt-3">
          💡 轻触交叉点落子 · 单指拖拽旋转 · 双指缩放
        </div>
      </div>
      
      {/* 底部操作 */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (currentStepIndex > 0) {
                setTaskDone(false);
                onStepChange(currentStepIndex - 1);
              }
            }}
            disabled={currentStepIndex === 0}
            className="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            ← 上一步
          </button>
          
          <button
            onClick={() => {
              if (isLastStep) {
                // 最后一步 - 标记完成
                setTaskDone(true);
              } else {
                setTaskDone(false);
                onStepChange(currentStepIndex + 1);
              }
            }}
            className="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all bg-amber-600 text-white hover:bg-amber-700 shadow-md"
          >
            {isLastStep ? '完成 ✓' : '下一步 →'}
          </button>
        </div>
        
        <button
          onClick={() => {
            setTaskDone(false);
            onRestartLesson();
          }}
          className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          🔄 重新开始本关
        </button>
        
        {taskDone && isLastStep && (
          <div className="text-center py-2 text-green-600 font-bold text-sm animate-pulse">
            🎉 恭喜完成本关所有步骤！
          </div>
        )}
      </div>
    </div>
  );
}
