import React, { useState, useEffect } from "react";

interface Reply {
  id: string;
  text: string;
  tone: string;
  confidence: number;
}

const toneLabels: Record<string, string> = {
  casual: "Locker",
  formal: "Formell",
  freundlich: "Freundlich",
};

const toneColors: Record<string, string> = {
  casual: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  formal: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  freundlich: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
};

export function ReplyPanelView() {
  const [selectedText, setSelectedText] = useState("");
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const api = (window as any).ghostclip;

  useEffect(() => {
    if (!api) return;
    const cleanup = api.onReplyText((text: string) => {
      setSelectedText(text);
      setReplies([]);
      setCopied(null);
      setLoading(true);
      api.getReplies(text).then((result: Reply[]) => {
        setReplies(result || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
    return cleanup;
  }, []);

  const handleCopy = (reply: Reply) => {
    api?.writeClipboard(reply.text);
    setCopied(reply.id);
    setTimeout(() => {
      // Close panel after copy
      window.close();
    }, 400);
  };

  return (
    <div className="w-full h-full p-3" style={{ background: "transparent" }}>
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col"
        style={{
          background: "rgba(15, 15, 20, 0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(92, 124, 250, 0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(92,124,250,0.1)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
            Reply Suggestions
          </span>
          <span className="ml-auto text-[10px] text-white/30">Ctrl+Shift+R</span>
        </div>

        {/* Selected text preview */}
        <div className="px-4 py-2 border-b border-white/5">
          <p className="text-[11px] text-white/40 mb-1">Markierter Text:</p>
          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
            {selectedText || "..."}
          </p>
        </div>

        {/* Replies */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-xs text-white/40">Generiere Antworten...</p>
            </div>
          )}

          {!loading && replies.length === 0 && selectedText && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-white/30">Keine Vorschlaege verfuegbar</p>
            </div>
          )}

          {replies.map((reply, i) => (
            <button
              key={reply.id}
              onClick={() => handleCopy(reply)}
              className={`w-full text-left p-3 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group ${
                toneColors[reply.tone] || toneColors.casual
              } ${copied === reply.id ? "ring-2 ring-green-400/50" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {toneLabels[reply.tone] || reply.tone}
                </span>
                <span className="text-[9px] text-white/25 ml-auto">
                  {copied === reply.id ? "Kopiert!" : "Klick zum Kopieren"}
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                {reply.text}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/20">GhostClip AI</span>
          <span className="text-[10px] text-white/20">Esc zum Schliessen</span>
        </div>
      </div>
    </div>
  );
}
