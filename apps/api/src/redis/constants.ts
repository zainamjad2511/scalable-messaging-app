/** Single channel; message shape uses `kind` to branch (see RedisChatEventEnvelope). */
export const CHAT_EVENTS_CHANNEL = "chat:events";

/** Lowercased usernames with an active WS somewhere in the cluster (SADD on join, SREM on disconnect). */
export const CHAT_PRESENCE_USERS_SET_KEY = "chat:presence:users";
