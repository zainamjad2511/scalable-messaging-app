import WebSocket from "ws";
import { WsEvent, ClientPayload } from "@repo/types";
import { handleJoin, handleMessage, handlePing, handleFetchHistory } from "./eventHandlers";

export async function handleMessageDispatcher(
  socketId: string,
  ws: WebSocket,
  raw: string
): Promise<void> {
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    sendError(ws, "Invalid JSON");
    return;
  }

  const payload = json as ClientPayload;

  switch (payload.type) {
    case WsEvent.JOIN:
      await handleJoin(socketId, ws, payload);
      break;

    case WsEvent.MESSAGE:
      await handleMessage(socketId, ws, payload);
      break;

    case WsEvent.PING:
      handlePing(socketId, ws);
      break;

    case WsEvent.FETCH_HISTORY:
      await handleFetchHistory(socketId, ws, payload as any);
      break;

    default:
      sendError(ws, "Unknown event type");
      break;
  }
}

function sendError(ws: WebSocket, message: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: WsEvent.ERROR, message }));
  }
}
