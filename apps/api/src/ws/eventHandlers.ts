import WebSocket from "ws";
import { ClientJoin, ClientMessage, ClientFetchHistory, WsEvent, ServerMessage } from "@repo/types";
import { sanitizeUsername, isValidUsername, truncateContent } from "@repo/shared";
import { connectionManager } from "./connectionManager";
import { getChatHistory, saveMessage } from "../db/queries";
import { supabase } from "../db/supabase";
import { config } from "../config";
import { publishChatEvent, REDIS_CHAT_KIND, type RedisChatEventEnvelope } from "../redis";

function isRelayableServerMessage(p: unknown): p is ServerMessage {
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const o = p as Record<string, unknown>;
  return (
    o.type === WsEvent.BROADCAST &&
    typeof o.id === "string" &&
    typeof o.username === "string" &&
    typeof o.content === "string"
  );
}

/**
 * Fan-out chat events from other API replicas. Skip when `sourceNodeId` matches this node
 * (publisher already delivered locally).
 */
export function handleRedisChatEvent(envelope: RedisChatEventEnvelope): void {
  if (envelope.sourceNodeId === config.nodeId) return;

  if (envelope.kind === REDIS_CHAT_KIND.BROADCAST) {
    const p = envelope.payload;
    if (!isRelayableServerMessage(p)) {
      console.warn("[redis] dropped invalid global relay payload");
      return;
    }
    connectionManager.broadcastAll(p);
    return;
  }

  if (envelope.kind === REDIS_CHAT_KIND.DM) {
    const msg = envelope.payload;
    if (!isRelayableServerMessage(msg)) {
      console.warn("[redis] dropped invalid DM relay payload");
      return;
    }
    const recipient = msg.recipient_username;
    if (!recipient || typeof recipient !== "string") {
      console.warn("[redis] dropped DM relay without recipient_username");
      return;
    }
    connectionManager.sendToUsername(recipient, msg);
    if (recipient.toLowerCase() !== msg.username.toLowerCase()) {
      connectionManager.sendToUsername(msg.username, msg);
    }
  }
}

export async function handleJoin(
  socketId: string,
  ws: WebSocket,
  payload: ClientJoin
): Promise<void> {
  const username = sanitizeUsername(payload.username);

  if (!isValidUsername(username)) {
    return _sendError(ws, "Invalid username. 3-20 chars, a-z, 0-9, _ only.");
  }

  if (connectionManager.isUsernameTaken(username)) {
    return _sendError(ws, "Username is already taken.");
  }

  try {
    // 1. Get or create user in Supabase
    const { data: userId, error } = await supabase.rpc("get_or_create_user", {
      p_username: username,
    });

    if (error || !userId) {
      console.error(`[ws][${socketId}] Failed get_or_create_user:`, error);
      return _sendError(ws, "Failed to authenticate with database.");
    }

    // 2. Add to local registry
    connectionManager.add({
      socketId,
      userId: userId as string,
      username,
      ws,
      joinedAt: new Date(),
    });

    const onlineCount = connectionManager.getCount();

    // 3. Send WELCOME
    connectionManager.send(socketId, {
      type: WsEvent.WELCOME,
      userId: userId as string,
      username,
      nodeId: config.nodeId,
      onlineCount,
      activeUsers: connectionManager.getUsernames(),
    });

    // 4. Load & send initial global HISTORY
    try {
      const history = await getChatHistory(username, "global", 50);
      connectionManager.send(socketId, {
        type: WsEvent.HISTORY,
        messages: history,
      });
    } catch (err) {
      console.error(`[ws][${socketId}] Failed to load history:`, err);
    }

    // 5. Broadcast USER_JOINED
    connectionManager.broadcast(
      {
        type: WsEvent.USER_JOINED,
        username,
        onlineCount,
      },
      socketId
    );
  } catch (err) {
    console.error(`[ws][${socketId}] Error in handleJoin:`, err);
    return _sendError(ws, "Internal server error during join.");
  }
}

export async function handleMessage(
  socketId: string,
  ws: WebSocket,
  payload: ClientMessage
): Promise<void> {
  const client = connectionManager.getClient(socketId);
  if (!client) {
    return _sendError(ws, "You must join before sending messages.");
  }

  const content = truncateContent(payload.content);
  if (!content) {
    return _sendError(ws, "Message cannot be empty.");
  }

  try {
    // Save to DB with optional recipient for DMs
    const savedMessage = await saveMessage(client.username, content, config.nodeId, payload.recipient);

    const broadcastPayload = {
      type: WsEvent.BROADCAST,
      ...savedMessage,
    } as ServerMessage;

    if (payload.recipient) {
      // It's a DM, route it ONLY to recipient and sender
      connectionManager.sendToUsername(payload.recipient, broadcastPayload);
      if (payload.recipient.toLowerCase() !== client.username.toLowerCase()) {
        connectionManager.sendToUsername(client.username, broadcastPayload);
      }
      void publishChatEvent({
        sourceNodeId: config.nodeId,
        kind: REDIS_CHAT_KIND.DM,
        payload: broadcastPayload,
      }).catch((err) => console.error("[redis] publish DM failed:", err));
    } else {
      // Global chat, broadcast to all
      connectionManager.broadcastAll(broadcastPayload);
      void publishChatEvent({
        sourceNodeId: config.nodeId,
        kind: REDIS_CHAT_KIND.BROADCAST,
        payload: broadcastPayload,
      }).catch((err) => console.error("[redis] publish global failed:", err));
    }

  } catch (err) {
    console.error(`[ws][${socketId}] Error saving message:`, err);
    return _sendError(ws, "Failed to send message.");
  }
}

export async function handleFetchHistory(
  socketId: string,
  ws: WebSocket,
  payload: ClientFetchHistory
): Promise<void> {
  const client = connectionManager.getClient(socketId);
  if (!client) {
    return _sendError(ws, "You must join before fetching history.");
  }

  try {
    const history = await getChatHistory(client.username, payload.target || "global", 50);
    connectionManager.send(socketId, {
      type: WsEvent.HISTORY,
      messages: history,
    });
  } catch (err) {
    console.error(`[ws][${socketId}] Failed to load history:`, err);
    return _sendError(ws, "Failed to load chat history.");
  }
}

export function handleDisconnect(socketId: string): void {
  const client = connectionManager.remove(socketId);
  if (client) {
    const onlineCount = connectionManager.getCount();
    connectionManager.broadcastAll({
      type: WsEvent.USER_LEFT,
      username: client.username,
      onlineCount,
    });
  }
}

export function handlePing(_socketId: string, ws: WebSocket): void {
  // direct raw send if we don't know the socket yet
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: WsEvent.PONG }));
  }
}

function _sendError(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: WsEvent.ERROR, message }));
  }
}
