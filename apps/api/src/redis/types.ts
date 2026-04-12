/**
 * Cross-replica envelope. Step 3 will set `kind` (e.g. "broadcast") and `payload`
 * to match WebSocket server → client shapes.
 */
export type RedisChatEventEnvelope = {
  sourceNodeId: string;
  kind: string;
  payload?: unknown;
};
