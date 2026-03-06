import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

function renderMarkdown(text: string): React.ReactNode {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code block
    if (part.startsWith("```") && part.endsWith("```")) {
      const lines = part.slice(3, -3);
      const firstNewline = lines.indexOf("\n");
      const code = firstNewline >= 0 ? lines.slice(firstNewline + 1) : lines;
      return (
        <pre key={i} style={{
          background: "rgba(0,0,0,0.3)", borderRadius: "8px",
          padding: "10px 12px", margin: "8px 0", overflowX: "auto",
          fontSize: "12px", fontFamily: "'JetBrains Mono', monospace",
          border: "1px solid rgba(255,255,255,0.06)", lineHeight: 1.5,
        }}>
          <code>{code.trim()}</code>
        </pre>
      );
    }

    // Process inline markdown line by line
    const lines = part.split("\n");
    return lines.map((line, j) => {
      const key = `${i}-${j}`;

      // Empty line → spacing
      if (!line.trim()) return <div key={key} style={{ height: "8px" }} />;

      // Headers
      if (line.startsWith("### ")) return <div key={key} style={{ fontWeight: 700, fontSize: "14px", margin: "10px 0 4px", color: "#e8e8f0" }}>{processInline(line.slice(4))}</div>;
      if (line.startsWith("## ")) return <div key={key} style={{ fontWeight: 700, fontSize: "15px", margin: "12px 0 4px", color: "#e8e8f0" }}>{processInline(line.slice(3))}</div>;
      if (line.startsWith("# ")) return <div key={key} style={{ fontWeight: 700, fontSize: "16px", margin: "12px 0 6px", color: "#e8e8f0" }}>{processInline(line.slice(2))}</div>;

      // Bullet list
      if (/^[\-\*]\s/.test(line)) {
        return (
          <div key={key} style={{ display: "flex", gap: "8px", marginLeft: "4px", marginBottom: "2px" }}>
            <span style={{ color: "#5c7cfa", flexShrink: 0 }}>•</span>
            <span>{processInline(line.slice(2))}</span>
          </div>
        );
      }

      // Numbered list
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch) {
        return (
          <div key={key} style={{ display: "flex", gap: "8px", marginLeft: "4px", marginBottom: "2px" }}>
            <span style={{ color: "#5c7cfa", flexShrink: 0, fontSize: "12px", fontWeight: 600 }}>{numMatch[1]}.</span>
            <span>{processInline(line.slice(numMatch[0].length))}</span>
          </div>
        );
      }

      // Regular paragraph
      return <div key={key} style={{ marginBottom: "2px" }}>{processInline(line)}</div>;
    });
  });
}

function processInline(text: string): React.ReactNode {
  // Process bold, italic, inline code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // Inline code `...`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(codeMatch[1]);
      parts.push(
        <code key={idx++} style={{
          background: "rgba(92,124,250,0.12)", padding: "1px 5px",
          borderRadius: "4px", fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace", color: "#b0b0ff",
        }}>
          {codeMatch[2]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold **...**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(boldMatch[1]);
      parts.push(<strong key={idx++} style={{ fontWeight: 600, color: "#f0f0f8" }}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *...*
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(italicMatch[1]);
      parts.push(<em key={idx++} style={{ fontStyle: "italic", color: "#c8c8e0" }}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // No more matches — push remaining text
    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "16px", flexShrink: 0 }}>
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
              lineHeight: 1.6,
              wordBreak: "break-word",
            }}>
              {msg.role === "assistant" ? renderMarkdown(msg.text) : msg.text}
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
