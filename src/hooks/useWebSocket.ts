"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}

type MessageHandler = (message: WSMessage) => void;

// 事件类型到 Query Key 的映射表
const EVENT_QUERY_MAP: Record<string, string[]> = {
  TASK_CREATED: ["tasks"],
  TASK_STATUS_CHANGED: ["tasks", "dashboard"],
  TASK_SUBMITTED: ["tasks", "dashboard"],
  TASK_GRADED: ["tasks", "dashboard"],
  REWARD_REDEEMED: ["rewards", "dashboard"],
  REWARD_APPROVED: ["rewards"],
  READING_LOG_CREATED: ["reading", "books"],
  READING_LOG_GRADED: ["reading"],
  READING_LOG_COMMENTED: ["reading"],
  TIMER_STARTED: ["tasks"],
  POINTS_CHANGED: ["dashboard", "admin", "users"],
};

/**
 * WebSocket 客户端 Hook
 *
 * 自动连接到 WebSocket 服务器，收到事件后自动刷新相关 React Query 缓存。
 *
 * 用法：
 * ```tsx
 * const { isConnected } = useWebSocket();
 * ```
 */
export function useWebSocket(handler?: MessageHandler) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSMessage | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname;
    const port = process.env.NEXT_PUBLIC_WS_PORT || "3011";
    const url = `${protocol}//${host}:${port}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to", url);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastEvent(message);

          // 自动刷新 React Query 缓存
          const queryKeys = EVENT_QUERY_MAP[message.type];
          if (queryKeys) {
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: [key] });
            });
          }

          // 调用自定义处理器
          handler?.(message);
        } catch (err) {
          console.error("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected, reconnecting in 5s...");
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error("[WS] Connection error:", err);
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, [handler, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { isConnected, lastEvent };
}
