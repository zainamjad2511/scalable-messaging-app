// ─── CLIENT → SERVER payloads ─────────────────────────────────

export interface ClientJoin {
  type: "join";
  username: string;
}

export interface ClientMessage {
  type: "message";
  content: string;
}

export interface ClientPing {
  type: "ping";
}

/** Union of everything a client can send over WebSocket. */
export type ClientPayload = ClientJoin | ClientMessage | ClientPing;

// ─── Stored shape (DB row) ────────────────────────────────────

export interface StoredMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  nodeId: string | null;
  createdAt: string; // ISO-8601
}

// ─── SERVER → CLIENT payloads ─────────────────────────────────

export interface ServerWelcome {
  type: "welcome";
  userId: string;
  username: string;
  nodeId: string;
  onlineCount: number;
}

export interface ServerHistory {
  type: "history";
  messages: StoredMessage[];
}

export interface ServerMessage extends StoredMessage {
  type: "message";
}

export interface ServerUserJoined {
  type: "user_joined";
  username: string;
  onlineCount: number;
}

export interface ServerUserLeft {
  type: "user_left";
  username: string;
  onlineCount: number;
}

export interface ServerError {
  type: "error";
  message: string;
}

export interface ServerPong {
  type: "pong";
}

/** Union of everything the server can send to a client. */
export type ServerPayload =
  | ServerWelcome
  | ServerHistory
  | ServerMessage
  | ServerUserJoined
  | ServerUserLeft
  | ServerError
  | ServerPong;
