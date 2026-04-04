import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config";
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

httpServer.listen(config.port, () => {
  console.log(`[api] node=${config.nodeId} listening on :${config.port}`);
});
