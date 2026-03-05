import { Notification } from "electron";

type NotificationType = "clip" | "sensitive" | "smart" | "reply";

interface NotifyOptions {
  type: NotificationType;
  title: string;
  body: string;
  onClick?: () => void;
}

export function notify({ type, title, body, onClick }: NotifyOptions) {
  const notification = new Notification({
    title,
    body,
    silent: type === "clip", // clip notifications are silent
    urgency: type === "sensitive" ? "critical" : "normal",
  });

  if (onClick) {
    notification.on("click", onClick);
  }

  notification.show();

  // Auto-dismiss clip notifications after 2s
  if (type === "clip") {
    setTimeout(() => notification.close(), 2000);
  }
}

export function notifyClipCaptured(summary: string, type: string) {
  const icons: Record<string, string> = {
    text: "[clip]",
    image: "[img]",
    url: "[url]",
    file: "[file]",
  };
  notify({
    type: "clip",
    title: `${icons[type] || "[clip]"} Clip erfasst`,
    body: summary || "Neuer Clip gespeichert",
  });
}

export function notifySensitiveContent(summary: string) {
  notify({
    type: "sensitive",
    title: "Sensible Daten erkannt",
    body: `${summary} -- wird in 5 Min geloescht`,
  });
}

export function notifySmartSuggestion(suggestion: string) {
  notify({
    type: "smart",
    title: "Vorschlag",
    body: suggestion,
  });
}
