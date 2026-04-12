/** `kind` values for chat relay (single Redis channel, branch on kind). */
export const REDIS_CHAT_KIND = {
  /** Global room: fan-out with `broadcastAll`. */
  BROADCAST: "broadcast",
  /** DM: same as local `sendToUsername` for recipient + sender. */
  DM: "dm",
  /** Cross-node presence: fan-out `USER_JOINED` to all local sockets. */
  USER_JOINED: "user_joined",
  /** Cross-node presence: fan-out `USER_LEFT` to all local sockets. */
  USER_LEFT: "user_left",
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

/** Payload for `REDIS_CHAT_KIND.USER_JOINED` / `USER_LEFT` (matches client `ServerUserJoined` / `ServerUserLeft`). */
export type RedisPresenceRelayPayload = {
  username: string;
  onlineCount: number;
};
