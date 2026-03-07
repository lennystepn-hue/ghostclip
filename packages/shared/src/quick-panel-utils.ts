/**
 * Utility functions for the Quick Panel (Ctrl+Shift+V).
 * Kept in the shared package so they can be unit-tested independently of Electron/React.
 */

// ── Fuzzy match ────────────────────────────────────────────────────────────────

/**
 * Returns true when every character of `query` appears in `text` in order
 * (case-insensitive).  Empty query always matches.
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Filter chip parsing ────────────────────────────────────────────────────────

export interface QuickPanelFilter {
  /** Tag filter extracted from `#word` token */
  tag: string | null;
  /** App/source filter extracted from `@word` token */
  app: string | null;
  /**
   * Content-type filter extracted from:
   *   t:text | t:url | t:image | t:code
   *   u:<anything>  → "url"
   *   i:<anything>  → "image"
   */
  type: string | null;
  /** Remaining query text after all filter tokens have been removed */
  query: string;
}

/**
 * Parses a raw search string like `#work @chrome t:url meeting notes` into
 * structured filter chips and a plain-text query remainder.
 *
 * Recognised prefix tokens (all case-insensitive):
 *   #<tag>            → filter.tag
 *   @<app>            → filter.app
 *   t:text|url|image|code  → filter.type
 *   u:<anything>      → filter.type = "url"
 *   i:<anything>      → filter.type = "image"
 */
export function parseFilterQuery(raw: string): QuickPanelFilter {
  const filter: QuickPanelFilter = { tag: null, app: null, type: null, query: "" };
  const remaining: string[] = [];

  for (const token of raw.split(/\s+/)) {
    if (!token) continue;

    if (token.startsWith("#") && token.length > 1) {
      filter.tag = token.slice(1).toLowerCase();
    } else if (token.startsWith("@") && token.length > 1) {
      filter.app = token.slice(1).toLowerCase();
    } else if (/^t:(text|url|image|code)$/i.test(token)) {
      filter.type = token.slice(2).toLowerCase();
    } else if (/^u:/i.test(token)) {
      filter.type = "url";
    } else if (/^i:/i.test(token)) {
      filter.type = "image";
    } else {
      remaining.push(token);
    }
  }

  filter.query = remaining.join(" ");
  return filter;
}
