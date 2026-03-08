import { readFileSync, statSync, lstatSync, openSync, readSync, closeSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { homedir } from "node:os";
import type { FileMetadata } from "@ghostclip/shared";

// File type categories for content extraction
const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".json", ".yaml", ".yml", ".csv", ".log", ".xml", ".html", ".htm",
  ".toml", ".ini", ".cfg", ".conf", ".env.example",
]);

const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rs", ".java", ".css", ".scss",
  ".sql", ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".swift", ".kt", ".sh",
  ".bash", ".zsh", ".lua", ".r", ".dart", ".vue", ".svelte",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico"]);

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".txt": "text/plain", ".md": "text/markdown", ".json": "application/json",
  ".yaml": "application/yaml", ".yml": "application/yaml", ".csv": "text/csv",
  ".log": "text/plain", ".xml": "application/xml", ".html": "text/html",
  ".htm": "text/html", ".toml": "application/toml", ".ini": "text/plain",
  ".js": "application/javascript", ".ts": "application/typescript",
  ".jsx": "text/jsx", ".tsx": "text/tsx", ".py": "text/x-python",
  ".go": "text/x-go", ".rs": "text/x-rust", ".java": "text/x-java",
  ".css": "text/css", ".scss": "text/x-scss", ".sql": "application/sql",
  ".rb": "text/x-ruby", ".php": "text/x-php", ".c": "text/x-c",
  ".cpp": "text/x-c++", ".h": "text/x-c", ".hpp": "text/x-c++",
  ".swift": "text/x-swift", ".kt": "text/x-kotlin",
  ".sh": "application/x-sh", ".bash": "application/x-sh",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".pdf": "application/pdf", ".zip": "application/zip",
  ".tar": "application/x-tar", ".gz": "application/gzip",
};

const MAX_FILE_CONTENT_SIZE = 100_000; // 100KB max for text content extraction

export interface FileExtractResult {
  metadata: FileMetadata;
  content: string; // extracted text content or metadata summary
  contentType: "text" | "code" | "image" | "other";
}

/** Check if a file path is safe to read content from (inside user's home directory and not a symlink) */
function isSafeFilePath(filePath: string): boolean {
  const resolved = resolve(filePath);
  const home = homedir();
  if (!resolved.startsWith(home + "/") && resolved !== home) {
    return false;
  }
  // Reject symlinks to prevent symlink attacks
  try {
    const lstats = lstatSync(resolved);
    if (lstats.isSymbolicLink()) return false;
  } catch {
    return false;
  }
  return true;
}

function readFileHead(filePath: string, maxSize: number): string {
  const buf = Buffer.alloc(maxSize);
  const fd = openSync(filePath, "r");
  try {
    const bytesRead = readSync(fd, buf, 0, maxSize, 0);
    return buf.toString("utf-8", 0, bytesRead) + "\n... (truncated)";
  } finally {
    closeSync(fd);
  }
}

export function extractFileInfo(filePath: string): FileExtractResult | null {
  try {
    const stats = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const filename = basename(filePath);

    const metadata: FileMetadata = {
      filename,
      extension: ext,
      size: stats.size,
      path: filePath,
      mimeType: MIME_TYPES[ext] || "application/octet-stream",
    };

    const safe = isSafeFilePath(filePath);

    // Text files: extract full content (only if path is safe)
    if (TEXT_EXTENSIONS.has(ext)) {
      let textContent = "";
      if (!safe) {
        textContent = "(content extraction skipped — file outside home directory)";
      } else if (stats.size <= MAX_FILE_CONTENT_SIZE) {
        textContent = readFileSync(filePath, "utf-8");
      } else {
        textContent = readFileHead(filePath, MAX_FILE_CONTENT_SIZE);
      }
      return {
        metadata,
        content: `[File: ${filename}]\n\n${textContent}`,
        contentType: "text",
      };
    }

    // Code files: extract with syntax detection (only if path is safe)
    if (CODE_EXTENSIONS.has(ext)) {
      let codeContent = "";
      if (!safe) {
        codeContent = "(content extraction skipped — file outside home directory)";
      } else if (stats.size <= MAX_FILE_CONTENT_SIZE) {
        codeContent = readFileSync(filePath, "utf-8");
      } else {
        codeContent = readFileHead(filePath, MAX_FILE_CONTENT_SIZE);
      }
      const lang = ext.slice(1); // remove the dot
      return {
        metadata,
        content: `[Code: ${filename} (${lang})]\n\n${codeContent}`,
        contentType: "code",
      };
    }

    // Images: store metadata (actual image handling is done elsewhere)
    if (IMAGE_EXTENSIONS.has(ext)) {
      return {
        metadata,
        content: `[Image: ${filename}] ${formatFileSize(stats.size)}`,
        contentType: "image",
      };
    }

    // Other files: metadata only
    return {
      metadata,
      content: `[File: ${filename}] ${ext || "unknown type"}, ${formatFileSize(stats.size)}`,
      contentType: "other",
    };
  } catch (err: any) {
    console.error(`[FileExtractor] Failed to extract info for ${filePath}:`, err.message);
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get a file type icon string for display */
export function fileTypeIcon(ext: string): string {
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  return "file";
}
