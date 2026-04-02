"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Send, Hash, Users, Server, LogOut, ArrowLeft, MessageSquare } from "lucide-react";
import { StoredMessage } from "@repo/types";

export default function ChatPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState<string>("global"); // "global" or username
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pdc_username");
    if (!stored) {
      router.push("/");
    } else {
      setUsername(stored);
    }
  }, [router]);

  const { isConnected, messages, nodeId, onlineCount, activeUsers, error, sendMessage, fetchHistory } = useWebSocket(username);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When activeChat changes, fetch that specific history
  useEffect(() => {
    if (isConnected) {
      fetchHistory(activeChat);
    }
  }, [activeChat, isConnected, fetchHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (activeChat === "global") {
      sendMessage(input.trim());
    } else {
      sendMessage(input.trim(), activeChat);
    }
    
    setInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("pdc_username");
    router.push("/");
  };

  if (!username) return null; // Wait for redirect check

  // Provide a clean unique array of members to click on (exclude ourselves if we want, but let's include ourselves to chat with ourselves for testing!)
  const uniqueUsers = Array.from(new Set(activeUsers));

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden text-[var(--color-text-primary)]">
      
      {/* 1. MOCK SERVER SIDEBAR (Leftmost) */}
      <div className="w-[72px] bg-[var(--color-bg-tertiary)] flex flex-col items-center py-4 gap-4 flex-shrink-0 hide-scrollbar overflow-y-auto hidden md:flex border-r border-white/5">
        <div className="w-12 h-12 bg-gradient-to-tr from-[var(--color-brand-start)] to-[var(--color-brand-end)] rounded-2xl flex items-center justify-center cursor-pointer hover:rounded-xl transition-all shadow-lg">
          <Server className="w-6 h-6 text-white" />
        </div>
        <div className="w-8 h-[2px] bg-white/10 rounded-full" />
        <div 
          onClick={() => setActiveChat("global")}
          className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center cursor-pointer group hover:bg-[var(--color-brand-start)] ${activeChat === "global" ? 'bg-[var(--color-brand-start)] rounded-[16px] text-white' : 'bg-[var(--color-bg-secondary)] text-white/50'}`}
        >
          <Hash className="w-6 h-6" />
        </div>
      </div>

      {/* 2. CHANNELS / DM SIDEBAR */}
      <div className="w-60 bg-[var(--color-bg-secondary)] flex flex-col flex-shrink-0 hidden sm:flex border-r border-white/5">
        <div className="h-12 border-b border-white/5 flex items-center px-4 font-bold shadow-sm">
          Server Navigation
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <div className="px-2 text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            Channels
          </div>
          <button 
            onClick={() => setActiveChat("global")}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activeChat === "global" ? 'bg-white/10 text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'}`}
          >
            <Hash className="w-4 h-4 text-[var(--color-text-muted)]" />
            global-chat
          </button>

          <div className="px-2 text-xs font-semibold text-[var(--color-text-muted)] mt-6 mb-2 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Direct Messages
          </div>
          
          {uniqueUsers.map(user => (
            <button 
              key={user}
              onClick={() => setActiveChat(user)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activeChat === user ? 'bg-white/10 text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'}`}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center font-bold text-[10px] text-white uppercase">
                  {user.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-[-2px] w-2 h-2 bg-green-500 rounded-full border border-[var(--color-bg-secondary)]" />
              </div>
              <span className="truncate">{user} {user === username && "(You)"}</span>
            </button>
          ))}
          
        </div>
        
        {/* User Profile Bar */}
        <div className="h-14 bg-[var(--color-bg-tertiary)]/50 border-t border-white/5 flex items-center px-2 gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand-start)] to-[var(--color-brand-end)] flex items-center justify-center font-bold text-white uppercase flex-shrink-0">
            {username.charAt(0)}
          </div>
          <div className="flex-1 truncate">
            <div className="text-sm font-bold truncate">{username}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] truncate flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? "Online" : "Connecting..."}
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-md text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-primary)]">
        {/* Top Header */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[var(--color-bg-primary)] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="sm:hidden text-[var(--color-text-muted)] cursor-pointer hover:text-white mr-2" onClick={handleLogout}>
              <ArrowLeft className="w-5 h-5" />
            </span>
            {activeChat === "global" ? (
               <Hash className="w-5 h-5 text-[var(--color-text-muted)]" />
            ) : (
               <MessageSquare className="w-5 h-5 text-[var(--color-text-muted)]" />
            )}
            <span className="font-bold">{activeChat === "global" ? "global-chat" : `DMing @${activeChat}`}</span>
          </div>
          <div className="flex items-center gap-4 text-[var(--color-text-muted)] text-sm">
            {error && <span className="text-red-400">{error}</span>}
            <span className="bg-white/5 px-2 py-1 rounded-md text-xs border border-white/5 ring-1 ring-white/10 shadow-inner flex items-center gap-1">
              <Server className="w-3 h-3 text-[var(--color-brand-start)]" />
              {nodeId}
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Welcome Intro */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              {activeChat === "global" ? <Hash className="w-8 h-8 text-white" /> : <MessageSquare className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeChat === "global" ? "Welcome to #global-chat!" : `This is the beginning of your direct message history with @${activeChat}`}
            </h1>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-4" />

          {/* Messages */}
          {messages.map((msg: StoredMessage) => {
            const isMe = msg.username === username;
            
            return (
              <div key={msg.id} className="flex gap-4 group hover:bg-white/[0.02] -mx-4 px-4 py-1 transition-colors">
                <div className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5 bg-gradient-to-br from-[#2f3136] to-[#202225] flex items-center justify-center font-bold uppercase ring-1 ring-white/10 shadow-inner">
                  {msg.username.charAt(0)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-semibold ${isMe ? 'text-[var(--color-brand-start)]' : 'text-[var(--color-text-primary)]'}`}>
                      {msg.username}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 mt-1 whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 pt-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${activeChat === "global" ? "#global-chat" : "@" + activeChat}`}
              disabled={!isConnected}
              className="w-full bg-[#383A40] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-start)] transition-all disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || !isConnected}
              className="absolute right-2 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-start)] disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. ONLINE MEMBERS SIDEBAR */}
      <div className="w-60 bg-[var(--color-bg-secondary)] flex-shrink-0 hidden lg:flex flex-col border-l border-white/5">
        <div className="p-4">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Online — {onlineCount}
          </h3>
          
          {uniqueUsers.map(user => (
             <div 
               key={user}
               onClick={() => setActiveChat(user)}
               className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors group mt-1 ${activeChat === user ? 'bg-[var(--color-brand-start)]/20' : 'hover:bg-white/5'}`}
             >
             <div className="relative">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[#202225] flex items-center justify-center font-bold text-[var(--color-text-primary)] uppercase ring-1 ring-white/10">
                 {user.charAt(0)}
               </div>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-bg-secondary)]" />
             </div>
             <span className="text-[15px] group-hover:text-white text-[var(--color-text-primary)] truncate">
               {user} {user === username && <span className="text-xs opacity-50">(You)</span>}
             </span>
           </div>
          ))}

        </div>
      </div>

    </div>
  );
}
