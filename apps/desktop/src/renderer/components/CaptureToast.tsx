import React, { useState, useEffect, useCallback, useRef } from "react";

interface ToastClip {
  id: string;
  type: string;
  content: string;
  summary: string;
  tags: string[];
}

interface ToastItem {
  key: string;
  clip: ToastClip;
  phase: "enter" | "float" | "exit";
}

interface ToastSettings {
  enabled: boolean;
  position: "top-right" | "bottom-right" | "bottom-left";
  duration: number; // seconds
  filter: "all" | "url" | "image" | "text";
  quietMode: boolean;
}

interface CaptureToastProps {
  onOpenClips?: () => void;
}

const CLIP_TYPE_ICONS: Record<string, string> = {
  text: "📋",
  url: "🔗",
  image: "🖼️",
  file: "📁",
};

function getContainerStyle(position: ToastSettings["position"]): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    pointerEvents: "none",
  };
  switch (position) {
    case "top-right":
      return { ...base, top: "48px", right: "16px" };
    case "bottom-left":
      return { ...base, bottom: "16px", left: "16px" };
    case "bottom-right":
    default:
      return { ...base, bottom: "16px", right: "16px" };
  }
}

export function CaptureToast({ onOpenClips }: CaptureToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [settings, setSettings] = useState<ToastSettings>({
    enabled: true,
    position: "bottom-right",
    duration: 2,
    filter: "all",
    quietMode: false,
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());

  // Load toast settings from backend on mount
  useEffect(() => {
    const api = (window as any).ghostclip;
    api?.getSettings?.().then((s: any) => {
      if (!s) return;
      setSettings({
        enabled: s.toastEnabled !== "false",
        position: (s.toastPosition as ToastSettings["position"]) || "bottom-right",
        duration: Math.max(1, parseInt(s.toastDuration || "2", 10)),
        filter: (s.toastFilter as ToastSettings["filter"]) || "all",
        quietMode: s.quietMode === "true",
      });
    });
  }, []);

  // Clear all pending timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timers => timers.forEach(clearTimeout));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = useCallback((key: string) => {
    const timers = timersRef.current.get(key);
    if (timers) {
      timers.forEach(clearTimeout);
      timersRef.current.delete(key);
    }
    setToasts(prev => prev.map(t => t.key === key ? { ...t, phase: "exit" as const } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.key !== key)), 300);
  }, []);

  const showToast = useCallback(async (clip: any) => {
    // Re-fetch settings on each capture so changes in SettingsView take effect immediately
    const api = (window as any).ghostclip;
    let s = settingsRef.current;
    const raw = await api?.getSettings?.();
    if (raw) {
      s = {
        enabled: raw.toastEnabled !== "false",
        position: (raw.toastPosition as ToastSettings["position"]) || "bottom-right",
        duration: Math.max(1, parseInt(raw.toastDuration || "2", 10)),
        filter: (raw.toastFilter as ToastSettings["filter"]) || "all",
        quietMode: raw.quietMode === "true",
      };
      setSettings(s);
    }

    if (!s.enabled) return;
    if (s.quietMode) return;
    if (s.filter !== "all" && clip.type !== s.filter) return;

    const key = `${clip.id}-${Date.now()}`;
    setToasts(prev => [...prev.slice(-4), { key, clip, phase: "enter" as const }]);

    const durationMs = s.duration * 1000;

    // Switch to float phase after enter animation completes
    const t1 = setTimeout(() => {
      setToasts(prev => prev.map(t => t.key === key ? { ...t, phase: "float" as const } : t));
    }, 300);

    // Start exit animation before duration ends
    const t2 = setTimeout(() => {
      setToasts(prev => prev.map(t => t.key === key ? { ...t, phase: "exit" as const } : t));
    }, durationMs - 300);

    // Remove toast after full duration
    const t3 = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.key !== key));
      timersRef.current.delete(key);
    }, durationMs);

    timersRef.current.set(key, [t1, t2, t3]);
  }, []);

  useEffect(() => {
    const api = (window as any).ghostclip;
    if (!api?.onClipNew) return;
    const cleanup = api.onClipNew((clip: any) => showToast(clip));
    return cleanup;
  }, [showToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes ghostToastEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes ghostToastFloat {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-4px); }
        }
        @keyframes ghostToastExit {
          from { opacity: 1; transform: translateY(0)  scale(1);    }
          to   { opacity: 0; transform: translateY(8px) scale(0.96); }
        }
        .ghost-toast-enter { animation: ghostToastEnter 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
        .ghost-toast-float { animation: ghostToastFloat 2s ease-in-out infinite; }
        .ghost-toast-exit  { animation: ghostToastExit  0.3s ease-in both; }
      `}</style>
      <div style={getContainerStyle(settings.position)}>
        {toasts.map(({ key, clip, phase }) => (
          <ToastCard
            key={key}
            clip={clip}
            phase={phase}
            onClick={() => {
              onOpenClips?.();
              dismissToast(key);
            }}
            onDismiss={() => dismissToast(key)}
          />
        ))}
      </div>
    </>
  );
}

function ToastCard({
  clip,
  phase,
  onClick,
  onDismiss,
}: {
  clip: ToastClip;
  phase: "enter" | "float" | "exit";
  onClick: () => void;
  onDismiss: () => void;
}) {
  const icon = CLIP_TYPE_ICONS[clip.type] || "📋";
  const preview = (clip.summary || clip.content || "").slice(0, 40);
  const tagPreview = clip.tags?.slice(0, 2).join(", ");

  return (
    <div
      className={`ghost-toast-${phase}`}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(26,26,42,0.97), rgba(18,18,30,0.97))",
        border: "1px solid rgba(66,99,235,0.3)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 6px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(66,99,235,0.08)",
        cursor: "pointer",
        minWidth: "220px",
        maxWidth: "300px",
        pointerEvents: "all",
        userSelect: "none",
      }}
    >
      {/* Clip type icon */}
      <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1 }}>{icon}</span>

      {/* Content preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: "12px",
          color: "#e0e0e8",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
          marginBottom: tagPreview ? "2px" : 0,
        }}>
          {preview || "New clip captured"}
        </p>
        {tagPreview && (
          <p style={{
            fontSize: "10px",
            color: "#748ffc",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}>
            #{tagPreview.replace(/,\s*/g, " #")}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{
          background: "none",
          border: "none",
          color: "#5c5c75",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          padding: "2px 4px",
          flexShrink: 0,
          borderRadius: "4px",
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
