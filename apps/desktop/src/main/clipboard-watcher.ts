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
  filePaths?: string[]; // file paths when type is "file"
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
    try {
      // Cache file paths to avoid double read and race conditions
      const cachedFilePaths = this.readFilePaths();
      const currentHash = this.getCurrentHash(cachedFilePaths);
      if (!currentHash) return;

      // Same content as last check — skip
      if (currentHash === this.lastHash) return;

      this.lastHash = currentHash;
      this.lastTimestamp = Date.now();

      // Check if this content is already in DB (dedup)
      const entry = this.buildEntry(cachedFilePaths);
      if (entry && this.callback) {
        console.log(`[Watcher] New clip detected: ${entry.type} (${entry.content.slice(0, 60)}...)`);
        this.callback(entry);
      }
    } catch (err: any) {
      console.error("[Watcher] check error:", err.message);
    }
  }

  private getCurrentHash(filePaths?: string[]): string {
    // Check for copied files first (cross-platform)
    if (filePaths === undefined) filePaths = this.readFilePaths();
    if (filePaths.length > 0) {
      return createHash("sha256").update(filePaths.join("\n")).digest("hex");
    }

    const text = clipboard.readText();
    const image = clipboard.readImage();

    // Prioritize image hash if image is substantial (>1KB)
    // Must match buildEntry() priority to avoid hash mismatch loops
    if (!image.isEmpty()) {
      const pngBuffer = image.toPNG();
      if (pngBuffer.length > 1024) {
        return createHash("sha256").update(pngBuffer).digest("hex");
      }
    }
    if (text) {
      return createHash("sha256").update(text).digest("hex");
    }
    return "";
  }

  private buildEntry(filePaths?: string[]): ClipboardEntry | null {
    // Check for copied files first (cross-platform)
    if (filePaths === undefined) filePaths = this.readFilePaths();
    if (filePaths.length > 0) {
      const content = filePaths.join("\n");
      return {
        type: "file",
        content,
        contentHash: createHash("sha256").update(content).digest("hex"),
        timestamp: Date.now(),
        sourceApp: null,
        filePaths,
      };
    }

    const text = clipboard.readText();
    const image = clipboard.readImage();

    // Check for image first — prioritize image if it's substantial (>1KB)
    // Many apps copy both image + text (e.g., Chrome, Slack), so check image size
    if (!image.isEmpty()) {
      const pngBuffer = image.toPNG();
      const isSubstantialImage = pngBuffer.length > 1024; // more than 1KB = real image, not just an icon
      if (isSubstantialImage) {
        const base64 = pngBuffer.toString("base64");
        return {
          type: "image",
          content: base64,
          contentHash: createHash("sha256").update(pngBuffer).digest("hex"),
          timestamp: Date.now(),
          sourceApp: null,
        };
      }
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

  /** Read copied file paths from the clipboard (cross-platform) */
  private readFilePaths(): string[] {
    try {
      const platform = process.platform;

      if (platform === "win32") {
        // Windows: read file names via CF_HDROP format
        const raw = clipboard.readBuffer("FileNameW");
        if (raw && raw.length > 0) {
          // FileNameW is null-terminated UTF-16LE strings
          const decoded = raw.toString("utf16le");
          const paths = decoded.split("\0").filter((p) => p.length > 0);
          if (paths.length > 0 && paths.some((p) => /^[A-Z]:\\/i.test(p))) {
            return paths;
          }
        }
      } else if (platform === "darwin") {
        // macOS: read public.file-url format
        const raw = clipboard.read("public.file-url");
        if (raw && raw.startsWith("file://")) {
          try {
            const filePath = decodeURIComponent(new URL(raw).pathname);
            if (filePath) return [filePath];
          } catch { /* ignore decode errors */ }
        }
        // Also try NSFilenamesPboardType (multiple files)
        const text = clipboard.readText();
        if (text && text.startsWith("/") && !text.includes("\n")) {
          // Could be a file path from Finder — but only treat as file if
          // the file-url format was also present, to avoid false positives
        }
      } else {
        // Linux: check for x-special/gnome-copied-files or similar
        const gnomeCopied = clipboard.readBuffer("x-special/gnome-copied-files");
        if (gnomeCopied && gnomeCopied.length > 0) {
          const content = gnomeCopied.toString("utf8");
          // Format: "copy\nfile:///path1\nfile:///path2\n..."
          const lines = content.split("\n").filter((l) => l.startsWith("file://"));
          const paths = lines.map((l) => {
            try {
              return decodeURIComponent(new URL(l.trim()).pathname);
            } catch {
              return "";
            }
          }).filter((p) => p.length > 0);
          if (paths.length > 0) return paths;
        }

        // KDE uses text/uri-list
        const uriList = clipboard.readBuffer("text/uri-list");
        if (uriList && uriList.length > 0) {
          const content = uriList.toString("utf8");
          const lines = content.split("\n").filter((l) => l.startsWith("file://"));
          const paths = lines.map((l) => {
            try {
              return decodeURIComponent(new URL(l.trim()).pathname);
            } catch {
              return "";
            }
          }).filter((p) => p.length > 0);
          if (paths.length > 0) return paths;
        }
      }
    } catch (err: any) {
      console.error("[Watcher] readFilePaths error:", err.message);
    }
    return [];
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
