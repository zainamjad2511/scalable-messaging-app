"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Auto-redirect if already logged in
    const stored = localStorage.getItem("pdc_username");
    if (stored) {
      router.push("/chat");
    }
  }, [router]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) return;
    
    // Save to localStorage and redirect
    localStorage.setItem("pdc_username", username.trim());
    router.push("/chat");
  };

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor (Linear vibe) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-brand-start)] to-[var(--color-brand-end)] opacity-10 blur-[100px] rounded-full pointer-events-none" />

      <main className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo area */}
        <div className="mb-8 p-4 bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-[var(--color-brand-start)]" />
        </div>

        {/* Hero Text */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-muted)]">
          Real-time distributed messaging
        </h1>
        <p className="text-[var(--color-text-muted)] text-center mb-10 text-lg">
          Connect nodes. Send messages. Scale instantly.
        </p>

        {/* Login Card (Discord vibe) */}
        <div className="w-full bg-[var(--color-bg-secondary)] p-8 rounded-xl shadow-2xl ring-1 ring-white/5">
          <h2 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2">
            Create an account
          </h2>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label 
                htmlFor="username" 
                className="block text-xs font-bold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider"
              >
                Display Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="How should people call you?"
                className="w-full bg-[var(--color-bg-primary)] border border-white/10 rounded-md px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-start)] focus:border-transparent transition-all"
                required
                autoComplete="off"
                minLength={3}
              />
            </div>

            <button
              type="submit"
              disabled={username.trim().length < 3}
              className="w-full bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 group"
            >
              Continue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="mt-4 text-xs text-[var(--color-text-muted)] text-center">
            By registering, you agree that you are part of the distributed system test.
          </p>
        </div>
      </main>
    </div>
  );
}
