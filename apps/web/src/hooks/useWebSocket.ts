import { useState, useEffect, useRef, useCallback } from "react";
import { WsEvent, ClientPayload, ServerPayload, StoredMessage } from "@repo/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

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
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

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
        setActiveUsers(prev => prev.includes(payload.username) ? prev : [...prev, payload.username]);
        break;
      case WsEvent.USER_LEFT:
        setOnlineCount(payload.onlineCount);
        setActiveUsers(prev => prev.filter(name => name !== payload.username));
        break;
      case WsEvent.ERROR:
        setError(payload.message);
        break;
    }
  }, []);

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
