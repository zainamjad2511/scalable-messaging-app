import { useState, useEffect, useRef, useCallback } from "react";
import { WsEvent, ClientPayload, ServerPayload, StoredMessage } from "@repo/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

export function useWebSocket(username: string | null) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [nodeId, setNodeId] = useState<string>("Unknown node");
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!username) return;

    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
      // Send join event
      const joinPayload: ClientPayload = { type: WsEvent.JOIN, username };
      socket.send(JSON.stringify(joinPayload));
    };

    socket.onmessage = (event) => {
      try {
        const payload: ServerPayload = JSON.parse(event.data);
        handleServerPayload(payload);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setWs(null);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      // Don't overwrite explicit server errors with generic ws errors
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [username]);

  const handleServerPayload = useCallback((payload: ServerPayload) => {
    switch (payload.type) {
      case WsEvent.WELCOME:
        setUserId(payload.userId);
        setNodeId(payload.nodeId);
        setOnlineCount(payload.onlineCount);
        break;
      case WsEvent.HISTORY:
        setMessages(payload.messages);
        break;
      case WsEvent.MESSAGE:
        // Prevent duplicate optimistic messages if we add that later
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        break;
      case WsEvent.ERROR:
        setError(payload.message);
        break;
      // Other events like PING can be ignored or handled
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const payload: ClientPayload = { type: WsEvent.MESSAGE, content };
      wsRef.current.send(JSON.stringify(payload));
    },
    []
  );

  return {
    isConnected,
    messages,
    userId,
    nodeId,
    onlineCount,
    error,
    sendMessage,
  };
}
