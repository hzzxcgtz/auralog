"use client";

import { useState, useEffect, useCallback } from "react";
import { useTimerStore } from "@/stores/timerStore";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function useTaskTimer() {
  const store = useTimerStore();
  const [display, setDisplay] = useState("00:00:00");

  // 恢复计时器
  useEffect(() => {
    store.restoreTimer();
  }, []);

  // 更新显示
  useEffect(() => {
    if (!store.isRunning || !store.startTimestamp) return;

    const update = () => {
      const elapsed = Math.floor((Date.now() - store.startTimestamp!) / 1000);
      setDisplay(formatDuration(elapsed));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [store.isRunning, store.startTimestamp]);

  return {
    display,
    isRunning: store.isRunning,
    activeTaskId: store.activeTaskId,
    startTimer: store.startTimer,
    stopTimer: store.stopTimer,
  };
}
