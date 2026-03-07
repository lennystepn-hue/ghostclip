/**
 * Content-type detector for AI Auto-Actions.
 * Uses pure regex — no network calls, runs synchronously.
 */

export type ContentKind =
  | "error_message"
  | "code_snippet"
  | "phone_number"
  | "address"
  | "json"
  | "xml"
  | "color_hex"
  | "cron_expression"
  | "regex_pattern"
  | "datetime"
  | "url"
  | "text";

export interface ContentDetectionResult {
  kind: ContentKind;
  metadata: Record<string, string | number | boolean>;
}

/** Detect the semantic content type of a text string. */
export function detectContentKind(text: string): ContentDetectionResult {
  const trimmed = text.trim();

  // URL (single-line)
  if (!trimmed.includes("\n")) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { kind: "url", metadata: { url: trimmed } };
      }
    } catch {
      // not a URL
    }
  }

  // Color hex: #RGB or #RRGGBB (optional alpha #RRGGBBAA)
  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3}([0-9a-fA-F]{2})?)?$/.test(trimmed)) {
    return { kind: "color_hex", metadata: { hex: trimmed.toUpperCase() } };
  }

  // JSON: starts with { or [, try to parse
  if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length > 2) {
    try {
      JSON.parse(trimmed);
      return { kind: "json", metadata: {} };
    } catch {
      // not valid JSON, fall through
    }
  }

  // XML: starts with a tag and contains a closing tag
  if (/^<[a-zA-Z]/.test(trimmed) && /<\/[a-zA-Z]/.test(trimmed)) {
    return { kind: "xml", metadata: {} };
  }

  // Cron expression: 5 or 6 space-separated fields on a single line.
  // Each field: *, */N, or digit-based ranges/lists (optionally with /step).
  if (!trimmed.includes("\n")) {
    const cronFields = trimmed.split(/\s+/);
    const isCronField = (f: string) =>
      /^(\*(?:\/\d+)?|\d+(?:[-,]\d+)*(?:\/\d+)?)$/.test(f);
    if ((cronFields.length === 5 || cronFields.length === 6) && cronFields.every(isCronField)) {
      return { kind: "cron_expression", metadata: { cron: trimmed } };
    }
  }

  // Regex pattern: /pattern/flags on a single line (not a URL)
  if (/^\/(.+)\/[gimsuy]*$/.test(trimmed) && !trimmed.includes("\n") && trimmed.length > 2) {
    return { kind: "regex_pattern", metadata: { pattern: trimmed } };
  }

  // Error message: known error prefixes or stack trace lines
  const errorPatterns = [
    /^(Error|TypeError|SyntaxError|ReferenceError|RangeError|URIError|EvalError|Exception):/m,
    /Traceback \(most recent call last\):/m,
    /^\s+at\s+\S+\s+\(\S+:\d+:\d+\)/m,
    /^\s+at\s+\S+:\d+:\d+/m,
  ];
  if (errorPatterns.some((p) => p.test(trimmed))) {
    return { kind: "error_message", metadata: {} };
  }

  // Date/time: checked before phone to avoid ISO dates being misread as phone numbers
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/, // ISO 8601
    /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}(\s\d{2}:\d{2}(:\d{2})?)?$/, // common date formats
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // RFC 2822
    /^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i, // long date
  ];
  if (!trimmed.includes("\n") && datePatterns.some((p) => p.test(trimmed))) {
    return { kind: "datetime", metadata: { datetime: trimmed } };
  }

  // Phone number: starts with optional +, then only digits/spaces/hyphens/parens/dots
  // Must be 7–15 digits total and single-line
  if (!trimmed.includes("\n") && /^[+\d][\d\s\-.()+]{6,}$/.test(trimmed)) {
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return { kind: "phone_number", metadata: { phone: trimmed, digits: digitsOnly } };
    }
  }

  // Address: multi-line text with street/postal patterns
  const addressStreetPattern =
    /\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b/i;
  const addressPostalPattern = /\b(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/; // US ZIP or Canadian postal
  if (
    trimmed.split("\n").length >= 2 &&
    (addressStreetPattern.test(trimmed) || addressPostalPattern.test(trimmed))
  ) {
    return { kind: "address", metadata: {} };
  }

  // Code snippet: requires multi-line text with several code-like markers
  const codeMarkers = [
    /^(import|export|const|let|var|function|class|def |async |return |if |for |while )/m, // keyword at line start
    /\w+\s*\(.*\)\s*[:{]/m, // function/method with block delimiter (JS/Python)
    /^\s{2,}\S/m, // indented lines (at least 2 spaces)
    /[{}]\s*$/m, // line ending with { or }
    /=>|\.\w+\(/, // arrow functions or method chains
  ];
  if (trimmed.includes("\n") && codeMarkers.filter((p) => p.test(trimmed)).length >= 2) {
    return { kind: "code_snippet", metadata: {} };
  }

  return { kind: "text", metadata: {} };
}

export interface AutoAction {
  label: string;
  type: string;
  payload: Record<string, string | number | boolean>;
}

/** Return context-aware suggested actions for a detected content kind. */
export function getAutoActions(result: ContentDetectionResult): AutoAction[] {
  switch (result.kind) {
    case "error_message":
      return [
        { label: "Search for solution", type: "search_error", payload: {} },
        { label: "Ask AI for fix", type: "ai_explain", payload: {} },
      ];
    case "url":
      return [
        { label: "Open URL", type: "open_url", payload: {} },
        { label: "Save as bookmark", type: "bookmark", payload: {} },
      ];
    case "code_snippet":
      return [
        { label: "Explain code", type: "ai_explain", payload: {} },
        { label: "Check for bugs", type: "ai_review", payload: {} },
        { label: "Format code", type: "format_code", payload: {} },
      ];
    case "phone_number":
      return [
        { label: "Copy formatted", type: "copy_formatted", payload: { phone: result.metadata.phone } },
        { label: "Add to contacts", type: "contacts_template", payload: { phone: result.metadata.phone } },
      ];
    case "address":
      return [
        { label: "Open in Maps", type: "open_maps", payload: {} },
      ];
    case "json":
      return [
        { label: "Pretty-print", type: "format_json", payload: {} },
        { label: "Validate JSON", type: "validate_json", payload: {} },
      ];
    case "xml":
      return [
        { label: "Pretty-print", type: "format_xml", payload: {} },
      ];
    case "color_hex":
      return [
        { label: "Copy hex", type: "copy_hex", payload: { hex: result.metadata.hex } },
      ];
    case "cron_expression":
      return [
        { label: "Explain schedule", type: "explain_cron", payload: { cron: result.metadata.cron } },
      ];
    case "regex_pattern":
      return [
        { label: "Explain regex", type: "explain_regex", payload: { pattern: result.metadata.pattern } },
      ];
    case "datetime":
      return [
        { label: "Show relative time", type: "relative_time", payload: { datetime: result.metadata.datetime } },
        { label: "Convert timezone", type: "convert_timezone", payload: { datetime: result.metadata.datetime } },
      ];
    default:
      return [];
  }
}

/** Human-readable label for a ContentKind. */
export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  error_message: "Error Message",
  code_snippet: "Code Snippet",
  phone_number: "Phone Number",
  address: "Address",
  json: "JSON",
  xml: "XML",
  color_hex: "Color Code",
  cron_expression: "Cron Expression",
  regex_pattern: "Regex",
  datetime: "Date / Time",
  url: "URL",
  text: "Text",
};
