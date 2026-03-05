"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { aiChat } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hallo! Ich bin dein GhostClip AI-Assistent. Frag mich was ueber deine Clips -- zum Beispiel \"Was hat Max letzte Woche geschrieben?\" oder \"Zeig mir allen Code den ich kopiert hab\"." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const data = await aiChat(currentInput);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.message || "Keine Antwort erhalten.",
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung. Bitte versuche es erneut.",
        error: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-ghost-400" />
        <h1 className="text-xl font-bold text-white">AI Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-ghost-600 text-white"
                : msg.error
                  ? "bg-accent-red/10 border border-accent-red/20 text-accent-red"
                  : "bg-glass border border-white/5 text-surface-900"
            }`}>
              {msg.error && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-glass border border-white/5 text-surface-700 text-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Denke nach...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Frag mich was ueber deine Clips..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-surface-200 border border-white/5 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-ghost-500/50 disabled:opacity-50"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-3 rounded-xl bg-ghost-600 text-white hover:bg-ghost-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
