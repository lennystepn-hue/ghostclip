import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const api = (window as any).ghostclip;

  // Load persisted chat history on mount
  useEffect(() => {
    if (historyLoaded) return;
    api?.getChatHistory?.().then((history: any[]) => {
      if (history && history.length > 0) {
        setMessages(history.map((m: any) => ({
          role: m.role as "user" | "assistant",
          text: m.text,
          timestamp: m.createdAt,
        })));
      } else {
        setMessages([{
          role: "assistant",
          text: "Hallo! Ich bin dein GhostClip AI Assistent. Ich habe Zugriff auf deine gesamte Clipboard-Historie. Frag mich was — z.B. \"Was habe ich heute kopiert?\", \"Finde alle Links\" oder \"Was war der Code-Snippet von gestern?\".",
          timestamp: new Date().toISOString(),
        }]);
      }
      setHistoryLoaded(true);
    });
  }, [historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await api?.aiChat?.(userMsg.text);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: response || "Keine Antwort erhalten.",
        timestamp: new Date().toISOString(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Fehler: " + (err.message || "Unbekannter Fehler"),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await api?.clearChatHistory?.();
    setMessages([{
      role: "assistant",
      text: "Chat-Verlauf geloescht. Wie kann ich dir helfen?",
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexShrink: 0 }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#e0e0e8" }}>
          AI Chat
        </h2>
        <button
          onClick={clearHistory}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(34,34,46,0.4)",
            color: "#5c5c75",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Verlauf loeschen
        </button>
      </div>

      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px",
        paddingRight: "8px", marginBottom: "16px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, rgba(66,99,235,0.3), rgba(92,124,250,0.2))"
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${msg.role === "user" ? "rgba(92,124,250,0.2)" : "rgba(255,255,255,0.05)"}`,
              color: "#e0e0e8",
              fontSize: "13px",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "12px 12px 12px 2px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "#5c5c75",
              fontSize: "13px",
            }}>
              Denke nach...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Frag mich was ueber deine Clips..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(34,34,46,0.6)",
            color: "#e0e0e8",
            fontSize: "13px",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: loading ? "rgba(66,99,235,0.1)" : "#4263eb",
            border: "none",
            color: "white",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Senden
        </button>
      </div>
    </div>
  );
}
