#!/usr/bin/env node

/**
 * AuraLog WebSocket 实时同步服务器
 *
 * 运行方式：node server/ws-server.js
 * 端口：3001（可通过 WS_PORT 环境变量修改）
 *
 * 与 Next.js 开发服务器同时启动：
 *   npm run dev    # Next.js on port 3000
 *   node server/ws-server.js  # WS on port 3001
 */

const { WebSocketServer } = require("ws");

const PORT = parseInt(process.env.WS_PORT || "3001");
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();

console.log(`[AuraLog WS] 实时同步服务启动中...`);

wss.on("listening", () => {
  console.log(`[AuraLog WS] ✓ WebSocket 服务器运行在 ws://0.0.0.0:${PORT}`);
  console.log(`[AuraLog WS]   客户端连接后将自动同步任务状态、积分变化等实时事件`);
});

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  clients.add(ws);
  console.log(`[AuraLog WS] + 客户端已连接 (${clientIp}), 当前连接数: ${clients.size}`);

  // 发送连接确认
  ws.send(JSON.stringify({
    type: "CONNECTED",
    payload: { message: "已连接到 AuraLog 实时同步服务" },
    timestamp: Date.now(),
  }));

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[AuraLog WS] - 客户端断开, 当前连接数: ${clients.size}`);
  });

  ws.on("error", (err) => {
    console.error("[AuraLog WS] 连接错误:", err.message);
    clients.delete(ws);
  });

  // 10 秒心跳保活
  const keepAlive = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    } else {
      clearInterval(keepAlive);
    }
  }, 10000);
});

wss.on("error", (err) => {
  console.error("[AuraLog WS] 服务错误:", err.message);
});

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n[AuraLog WS] 正在关闭服务...");
  clients.forEach((client) => {
    client.close();
  });
  wss.close(() => {
    console.log("[AuraLog WS] 服务已关闭");
    process.exit(0);
  });
});

// 广播函数 — 可通过 HTTP 接口触发
// 使用方式: curl http://localhost:3001/trigger -d '{"type":"TASK_GRADED","payload":{...}}'
const http = require("http");
const httpServer = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/trigger") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const msg = JSON.parse(body);
        const data = JSON.stringify({ ...msg, timestamp: Date.now() });
        let count = 0;
        clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(data);
            count++;
          }
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, broadcastTo: count }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("AuraLog WebSocket Server\n");
  }
});

httpServer.listen(PORT + 1000, () => {
  console.log(`[AuraLog WS] HTTP 触发接口运行在 http://localhost:${PORT + 1000}/trigger`);
  console.log(`[AuraLog WS] 使用 POST /trigger 发送 {'type':'...','payload':{...}} 来广播消息`);
});
