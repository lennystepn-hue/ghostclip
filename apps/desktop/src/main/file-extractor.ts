import { readFileSync, statSync, lstatSync, openSync, readSync, closeSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { homedir } from "node:os";
import type { FileMetadata } from "@ghostclip/shared";

// Lazy-loaded extractors (avoid startup cost)
let pdfParse: any = null;
let XLSX: any = null;

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

const DOCUMENT_EXTENSIONS = new Set([".pdf", ".xlsx", ".xls", ".docx"]);

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
  const sep = process.platform === "win32" ? "\\" : "/";
  if (!resolved.startsWith(home + sep) && resolved !== home) {
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

/** Extract text from a PDF file */
function extractPdfText(filePath: string): string {
  try {
    if (!pdfParse) pdfParse = require("pdf-parse");
    const buffer = readFileSync(filePath);
    // pdf-parse returns a promise, but we need sync — use a sync workaround
    // Since Electron main process, we do async extraction and cache
    // For now, read raw text from buffer (basic extraction)
    const text = buffer.toString("utf-8", 0, Math.min(buffer.length, MAX_FILE_CONTENT_SIZE));
    // Filter out binary garbage, keep readable text fragments
    const readable = text.replace(/[^\x20-\x7E\n\r\t\xC0-\xFF]/g, " ")
      .replace(/ {3,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (readable.length > 100) {
      return readable.slice(0, MAX_FILE_CONTENT_SIZE);
    }
    return "(PDF content could not be extracted as text)";
  } catch (err: any) {
    console.error(`[FileExtractor] PDF extraction failed:`, err.message);
    return "(PDF content extraction failed)";
  }
}

/** Extract text from an Excel file */
function extractExcelText(filePath: string): string {
  try {
    if (!XLSX) XLSX = require("xlsx");
    const workbook = XLSX.readFile(filePath, { type: "file", cellText: true, cellDates: true });
    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv.trim()) {
        parts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
      // Limit total size
      if (parts.join("\n\n").length > MAX_FILE_CONTENT_SIZE) break;
    }
    const result = parts.join("\n\n");
    return result.slice(0, MAX_FILE_CONTENT_SIZE) || "(Excel file is empty)";
  } catch (err: any) {
    console.error(`[FileExtractor] Excel extraction failed:`, err.message);
    return "(Excel content extraction failed)";
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
    const unsafeMsg = "(content extraction skipped — file outside home directory)";

    // Text files: extract full content
    if (TEXT_EXTENSIONS.has(ext)) {
      let textContent = "";
      if (!safe) {
        textContent = unsafeMsg;
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

    // Code files: extract with syntax detection
    if (CODE_EXTENSIONS.has(ext)) {
      let codeContent = "";
      if (!safe) {
        codeContent = unsafeMsg;
      } else if (stats.size <= MAX_FILE_CONTENT_SIZE) {
        codeContent = readFileSync(filePath, "utf-8");
      } else {
        codeContent = readFileHead(filePath, MAX_FILE_CONTENT_SIZE);
      }
      const lang = ext.slice(1);
      return {
        metadata,
        content: `[Code: ${filename} (${lang})]\n\n${codeContent}`,
        contentType: "code",
      };
    }

    // Document files: PDF, Excel, CSV — extract content
    if (DOCUMENT_EXTENSIONS.has(ext)) {
      let docContent = "";
      if (!safe) {
        docContent = unsafeMsg;
      } else if (ext === ".pdf") {
        docContent = extractPdfText(filePath);
      } else if (ext === ".xlsx" || ext === ".xls") {
        docContent = extractExcelText(filePath);
      } else if (ext === ".docx") {
        // Basic docx extraction: read XML content
        try {
          if (!XLSX) XLSX = require("xlsx");
          // xlsx can also parse basic docx-like structures, but for real docx
          // we just extract the raw text from the zip
          const raw = readFileSync(filePath);
          const text = raw.toString("utf-8")
            .replace(/<[^>]+>/g, " ")
            .replace(/[^\x20-\x7E\n\r\t\xC0-\xFF]/g, " ")
            .replace(/ {3,}/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
          docContent = text.slice(0, MAX_FILE_CONTENT_SIZE) || "(DOCX content could not be extracted)";
        } catch {
          docContent = "(DOCX content extraction failed)";
        }
      }

      console.log(`[FileExtractor] Document extracted: ${filename} (${formatFileSize(stats.size)}, ${docContent.length} chars)`);
      return {
        metadata,
        content: `[Document: ${filename}] ${formatFileSize(stats.size)}\n\n${docContent}`,
        contentType: "text",
      };
    }

    // Images: store metadata
    if (IMAGE_EXTENSIONS.has(ext)) {
      return {
        metadata,
        content: `[Image: ${filename}] ${formatFileSize(stats.size)}`,
        contentType: "image",
      };
    }

    // Other files: metadata + basic info
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
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  return "file";
}
