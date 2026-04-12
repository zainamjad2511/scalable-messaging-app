/** `kind` values for chat relay (single Redis channel, branch on kind). */
export const REDIS_CHAT_KIND = {
  /** Global room: fan-out with `broadcastAll`. */
  BROADCAST: "broadcast",
  /** DM: same as local `sendToUsername` for recipient + sender. */
  DM: "dm",
} as const;

export type RedisChatKind = (typeof REDIS_CHAT_KIND)[keyof typeof REDIS_CHAT_KIND];

/**
 * Cross-replica envelope. `payload` is a `ServerMessage` (type `"message"`) for chat kinds.
 */
export type RedisChatEventEnvelope = {
  sourceNodeId: string;
  kind: string;
  payload?: unknown;
};
