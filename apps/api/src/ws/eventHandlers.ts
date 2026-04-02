import WebSocket from "ws";
import { ClientJoin, ClientMessage, WsEvent } from "@repo/types";
import { sanitizeUsername, isValidUsername, truncateContent } from "@repo/shared";
import { connectionManager } from "./connectionManager";
import { getRecentMessages, saveMessage } from "../db/queries";
import { supabase } from "../db/supabase";
import { config } from "../config";

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
    });

    // 4. Load & send HISTORY
    try {
      const history = await getRecentMessages(50);
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
    // Save to DB
    const savedMessage = await saveMessage(client.username, content, config.nodeId);

    // Broadcast to all
    connectionManager.broadcastAll({
      type: WsEvent.BROADCAST,
      ...savedMessage,
    });
  } catch (err) {
    console.error(`[ws][${socketId}] Error saving message:`, err);
    return _sendError(ws, "Failed to send message.");
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
