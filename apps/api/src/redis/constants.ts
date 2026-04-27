/** Single channel; message shape uses `kind` to branch (see RedisChatEventEnvelope). */
export const CHAT_EVENTS_CHANNEL = "chat:events";

/**
 * Cluster-wide online presence with TTL semantics.
 * ZSET member = normalized username, score = expiry epoch seconds.
 */
export const CHAT_PRESENCE_USERS_ZSET_KEY = "chat:presence:user_expiry";

/** Seconds until a presence entry is considered stale unless refreshed (join/ping). */
export const CHAT_PRESENCE_TTL_SECONDS = 30;
