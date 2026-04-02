/**
 * WebSocket event names — single source of truth for client ↔ server protocol.
 */
export const WsEvent = {
  // CLIENT → SERVER
  JOIN: "join",
  MESSAGE: "message",
  PING: "ping",
  FETCH_HISTORY: "fetch_history",

  // SERVER → CLIENT
  WELCOME: "welcome",
  HISTORY: "history",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  BROADCAST: "message", // reuses "message" type for broadcast
  PONG: "pong",
  ERROR: "error",
} as const;

export type WsEventType = (typeof WsEvent)[keyof typeof WsEvent];
