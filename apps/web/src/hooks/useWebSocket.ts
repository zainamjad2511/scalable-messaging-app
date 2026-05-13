import { useState, useEffect, useRef, useCallback } from "react";
import { WsEvent, ClientPayload, ServerPayload, StoredMessage } from "@repo/types";

/**
 * Default `ws://localhost` is port 80 — matches Nginx in Docker Compose (Phase 2/3).
 * For `npm run dev:api` on this machine only, set `NEXT_PUBLIC_WS_URL=ws://localhost:4000` in `.env.local`.
 */
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost";

export function useWebSocket(username: string | null, activeChat: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [nodeId, setNodeId] = useState<string>("Unknown node");
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const handleServerPayload = useCallback((payload: ServerPayload) => {
    switch (payload.type) {
      case WsEvent.WELCOME:
        setUserId(payload.userId);
        setNodeId(payload.nodeId);
        setOnlineCount(payload.onlineCount);
        if (payload.activeUsers) setActiveUsers(payload.activeUsers);
        break;
      case WsEvent.HISTORY:
        setMessages(payload.messages);
        break;
      case WsEvent.MESSAGE:
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.id)) return prev;

          const currentChat = activeChatRef.current;
          const isGlobalMsg = !payload.recipient_username;

          if (currentChat === "global") {
            if (!isGlobalMsg) return prev; // It's a DM, ignore for global chat
          } else {
            if (isGlobalMsg) return prev; // It's global, ignore for DM
            // Ensure DM belongs to the activeChat user session
            if (payload.username !== currentChat && payload.recipient_username !== currentChat) {
              return prev;
            }
          }

          return [...prev, payload];
        });
        break;
      case WsEvent.USER_JOINED:
        setOnlineCount(payload.onlineCount);
        setActiveUsers((prev) => (prev.includes(payload.username) ? prev : [...prev, payload.username]));
        break;
      case WsEvent.USER_LEFT:
        setOnlineCount(payload.onlineCount);
        setActiveUsers((prev) => prev.filter((name) => name !== payload.username));
        break;
      case WsEvent.ERROR:
        setError(payload.message);
        break;
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    const clearTimers = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };

    const connect = () => {
      clearTimers();

      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
        setError(null);

        const joinPayload: ClientPayload = { type: WsEvent.JOIN, username };
        socket.send(JSON.stringify(joinPayload));

        // Keep presence TTL fresh + detect dead TCP links.
        pingTimerRef.current = window.setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          wsRef.current.send(JSON.stringify({ type: WsEvent.PING } satisfies ClientPayload));
        }, 15_000);
      };

      socket.onmessage = (event) => {
        try {
          const payload: ServerPayload = JSON.parse(event.data);
          handleServerPayload(payload);
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      const scheduleReconnect = () => {
        setIsConnected(false);
        setWs(null);
        clearTimers();

        // Exponential backoff with jitter (max ~10s).
        const attempt = reconnectAttemptRef.current++;
        const base = Math.min(10_000, 300 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 250);
        const delay = base + jitter;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onclose = scheduleReconnect;

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        // onclose will schedule reconnect; if the browser doesn't close promptly, we still try.
        if (socket.readyState === WebSocket.CLOSED) scheduleReconnect();
      };
    };

    connect();

    return () => {
      clearTimers();
      reconnectAttemptRef.current = 0;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [username, handleServerPayload]);

  const sendMessage = useCallback(
    (content: string, recipient?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      const payload: ClientPayload = { 
        type: WsEvent.MESSAGE, 
        content,
      };
      
      if (recipient) {
        payload.recipient = recipient;
      }
      
      wsRef.current.send(JSON.stringify(payload));
    },
    []
  );

  const fetchHistory = useCallback((target: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Clear out current messages visually while fetching the new ones
    setMessages([]);
    
    const payload: ClientPayload = {
      type: WsEvent.FETCH_HISTORY,
      target
    };
    wsRef.current.send(JSON.stringify(payload));
  }, []);

  return {
    isConnected,
    messages,
    userId,
    nodeId,
    onlineCount,
    activeUsers,
    error,
    sendMessage,
    fetchHistory
  };
}
