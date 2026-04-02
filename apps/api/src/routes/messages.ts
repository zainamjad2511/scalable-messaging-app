import { Router } from "express";
import { getRecentMessages } from "../db/queries";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const messages = await getRecentMessages(Math.min(limit, 100));
    res.json({ messages });
  } catch (error: any) {
    console.error("[route] /messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
