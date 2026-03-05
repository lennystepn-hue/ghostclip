"use client";
import React, { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hallo! Ich bin dein GhostClip AI-Assistent. Frag mich was ueber deine Clips — zum Beispiel \"Was hat Max letzte Woche geschrieben?\" oder \"Zeig mir allen Code den ich kopiert hab\"." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ich durchsuche deine Clips... (In der echten Version wuerde ich hier die Claude API nutzen und deine Clip-Metadaten als Kontext mitgeben.)",
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
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
                : "bg-glass border border-white/5 text-surface-900"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Frag mich was ueber deine Clips..."
          className="flex-1 px-4 py-3 rounded-xl bg-surface-200 border border-white/5 text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-ghost-500/50"
        />
        <button onClick={sendMessage} className="p-3 rounded-xl bg-ghost-600 text-white hover:bg-ghost-700 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
