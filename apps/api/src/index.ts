import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config";
import { startRedisBridge, stopRedisBridge } from "./redis";
import { handleMessageDispatcher } from "./ws/messageHandler";
import { handleDisconnect } from "./ws/eventHandlers";
import healthRouter from "./routes/health";
import messagesRouter from "./routes/messages";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/messages", messagesRouter);

// Basic error handling
app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[express error]", _err);
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, _res, next) => { // Adding the underscore tells TS "I know I'm not using this"
  console.log(`[${process.env.NODE_ID}] ${req.method} request to ${req.url}`);
  next();
});


const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  const socketId = uuidv4();

  // On every message, pass to the dispatcher
  ws.on("message", (raw) => {
    handleMessageDispatcher(socketId, ws as any, raw.toString()).catch((err) => {
      console.error(`[ws][${socketId}] unhandled dispather error:`, err);
    });
  });

  ws.on("close", () => handleDisconnect(socketId));
  ws.on("error", (err) => console.error(`[ws][${socketId}] error:`, err));
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[api] ${signal} received, shutting down`);
  await stopRedisBridge();
  wss.close();
  httpServer.close(() => {
    console.log("[api] http server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

httpServer.listen(config.port, () => {
  console.log(`[api] node=${config.nodeId} listening on :${config.port}`);
  void (async () => {
    if (!config.redisUrl) {
      console.log("[redis] REDIS_URL unset; running without cross-replica pub/sub");
      return;
    }
    try {
      await startRedisBridge(config.redisUrl);
    } catch (err) {
      console.error("[redis] failed to start:", err);
      process.exit(1);
    }
  })();
});
