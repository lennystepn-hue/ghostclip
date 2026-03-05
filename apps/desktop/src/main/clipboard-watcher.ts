import { clipboard, nativeImage } from "electron";
import { createHash } from "node:crypto";
import { CLIPBOARD_POLL_INTERVAL, DEDUP_WINDOW } from "@ghostclip/shared";

type ClipType = "text" | "image" | "url" | "file";

interface ClipboardEntry {
  type: ClipType;
  content: string; // text content or base64 for images
  contentHash: string;
  timestamp: number;
  sourceApp: string | null;
}

type ClipboardChangeCallback = (entry: ClipboardEntry) => void;

export class ClipboardWatcher {
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastHash: string = "";
  private lastTimestamp: number = 0;
  private callback: ClipboardChangeCallback | null = null;

  start(callback: ClipboardChangeCallback) {
    this.callback = callback;
    // Get initial clipboard state so we don't fire on startup
    this.lastHash = this.getCurrentHash();

    this.interval = setInterval(() => {
      this.check();
    }, CLIPBOARD_POLL_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.callback = null;
  }

  private check() {
    const currentHash = this.getCurrentHash();
    const now = Date.now();

    // No change
    if (currentHash === this.lastHash) return;

    // Dedup: same content within window
    if (now - this.lastTimestamp < DEDUP_WINDOW && currentHash === this.lastHash) return;

    this.lastHash = currentHash;
    this.lastTimestamp = now;

    const entry = this.buildEntry();
    if (entry && this.callback) {
      this.callback(entry);
    }
  }

  private getCurrentHash(): string {
    const text = clipboard.readText();
    const image = clipboard.readImage();

    if (text) {
      return createHash("sha256").update(text).digest("hex");
    }
    if (!image.isEmpty()) {
      return createHash("sha256").update(image.toPNG()).digest("hex");
    }
    return "";
  }

  private buildEntry(): ClipboardEntry | null {
    const text = clipboard.readText();
    const image = clipboard.readImage();

    // Check for image first
    if (!image.isEmpty() && !text) {
      const base64 = image.toPNG().toString("base64");
      return {
        type: "image",
        content: base64,
        contentHash: createHash("sha256").update(image.toPNG()).digest("hex"),
        timestamp: Date.now(),
        sourceApp: null,
      };
    }

    // Check for text
    if (text) {
      const type = this.detectType(text);
      return {
        type,
        content: text,
        contentHash: createHash("sha256").update(text).digest("hex"),
        timestamp: Date.now(),
        sourceApp: null,
      };
    }

    return null;
  }

  private detectType(text: string): ClipType {
    // URL detection
    try {
      const url = new URL(text.trim());
      if (url.protocol === "http:" || url.protocol === "https:") return "url";
    } catch {
      // not a URL
    }

    // File path detection
    if (/^(\/|[A-Z]:\\|~\/)/.test(text.trim()) && text.trim().split("\n").length === 1) {
      return "file";
    }

    return "text";
  }
}
