import { Router } from "express";
import { config } from "../config";
import { isRedisBridgeActive } from "../redis";
import { connectionManager } from "../ws/connectionManager";

const router = Router();

router.get("/", (_req, res) => {
  const redisConfigured = Boolean(config.redisUrl);
  const redisConnected = redisConfigured && isRedisBridgeActive();

  res.json({
    status: "ok",
    nodeId: config.nodeId,
    connectedClients: connectionManager.getCount(),
    uptime: process.uptime(),
    redisConfigured,
    redisConnected,
  });
});

export default router;
