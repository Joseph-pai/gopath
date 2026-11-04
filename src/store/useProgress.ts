import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProgressState {
  completedLevels: number[];
  currentLevel: number; // 10 为起点
  levelStepIndex: Record<number, number>;
  completedReviews: string[];
  
  completeLevel: (levelId: number) => void;
  setStepIndex: (levelId: number, stepIndex: number) => void;
  completeReview: (reviewId: string) => void;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completedLevels: [],
      currentLevel: 10,
      levelStepIndex: {},
      completedReviews: [],
      
      completeLevel: (levelId) => set((state) => ({
        completedLevels: state.completedLevels.includes(levelId)
          ? state.completedLevels
          : [...state.completedLevels, levelId],
        currentLevel: Math.min(state.currentLevel, levelId - 1),
      })),
      
      setStepIndex: (levelId, stepIndex) => set((state) => ({
        levelStepIndex: {
          ...state.levelStepIndex,
          [levelId]: stepIndex,
        },
      })),
      
      completeReview: (reviewId) => set((state) => ({
        completedReviews: state.completedReviews.includes(reviewId)
          ? state.completedReviews
          : [...state.completedReviews, reviewId],
      })),
      
      resetProgress: () => set({
        completedLevels: [],
        currentLevel: 10,
        levelStepIndex: {},
        completedReviews: [],
      }),
    }),
    {
      name: 'gopath-progress',
    }
  )
);
