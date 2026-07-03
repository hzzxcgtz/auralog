import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  activeTaskId: number | null;
  startTimestamp: number | null;
  elapsed: number;
  isRunning: boolean;

  startTimer: (taskId: number) => void;
  stopTimer: () => { taskId: number; spentSeconds: number } | null;
  restoreTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      startTimestamp: null,
      elapsed: 0,
      isRunning: false,

      startTimer: (taskId: number) => {
        set({
          activeTaskId: taskId,
          startTimestamp: Date.now(),
          elapsed: 0,
          isRunning: true,
        });
      },

      stopTimer: () => {
        const state = get();
        if (!state.activeTaskId || !state.startTimestamp) return null;
        const spentSeconds = Math.floor((Date.now() - state.startTimestamp) / 1000);
        set({
          activeTaskId: null,
          startTimestamp: null,
          elapsed: 0,
          isRunning: false,
        });
        return { taskId: state.activeTaskId, spentSeconds };
      },

      restoreTimer: () => {
        const state = get();
        if (state.isRunning && state.startTimestamp) {
          const elapsedSeconds = Math.floor((Date.now() - state.startTimestamp) / 1000);
          set({ elapsed: elapsedSeconds });
        }
      },
    }),
    {
      name: "aura-timer-storage",
      partialize: (state) => ({
        activeTaskId: state.activeTaskId,
        startTimestamp: state.startTimestamp,
        isRunning: state.isRunning,
      }),
    }
  )
);
