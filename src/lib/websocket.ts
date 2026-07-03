import { WebSocketServer, WebSocket } from "ws";

interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}

const WS_PORT = parseInt(process.env.WS_PORT || "3001");
let wss: WebSocketServer | null = null;

// 连接管理器
const clients = new Set<WebSocket>();

export function getWSS(): WebSocketServer | null {
  return wss;
}

export function startWebSocketServer(): WebSocketServer {
  if (wss) return wss;

  wss = new WebSocketServer({ port: WS_PORT });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log(`[WS] Client connected (${clients.size} total)`);

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} remaining)`);
    });

    ws.on("error", (err) => {
      console.error("[WS] Error:", err);
      clients.delete(ws);
    });

    // 发送连接确认
    ws.send(JSON.stringify({
      type: "CONNECTED",
      payload: { message: "已连接到 AuraLog 实时服务" },
      timestamp: Date.now(),
    }));
  });

  console.log(`[WS] WebSocket server started on port ${WS_PORT}`);
  return wss;
}

// 广播事件到所有连接
export function broadcast(type: string, payload: any): void {
  const message: WSMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };

  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 事件类型常量
export const WSEvents = {
  TASK_CREATED: "TASK_CREATED",
  TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",
  TASK_SUBMITTED: "TASK_SUBMITTED",
  TASK_GRADED: "TASK_GRADED",
  REWARD_REDEEMED: "REWARD_REDEEMED",
  REWARD_APPROVED: "REWARD_APPROVED",
  READING_LOG_CREATED: "READING_LOG_CREATED",
  READING_LOG_GRADED: "READING_LOG_GRADED",
  READING_LOG_COMMENTED: "READING_LOG_COMMENTED",
  TIMER_STARTED: "TIMER_STARTED",
  POINTS_CHANGED: "POINTS_CHANGED",
} as const;
