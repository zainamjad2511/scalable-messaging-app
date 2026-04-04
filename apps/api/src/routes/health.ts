import { Router } from "express";
import { config } from "../config";
import { connectionManager } from "../ws/connectionManager";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    nodeId: config.nodeId,
    connectedClients: connectionManager.getCount(),
    uptime: process.uptime(),
  });
});

export default router;
