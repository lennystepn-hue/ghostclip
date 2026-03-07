/**
 * Extract {variable} placeholder names from a template string.
 * Deduplicates and preserves insertion order.
 */
export function extractVariables(content: string): string[] {
  const matches = [...content.matchAll(/\{(\w+)\}/g)];
  const seen = new Set<string>();
  const vars: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      vars.push(m[1]);
    }
  }
  return vars;
}

/**
 * Fill a template by replacing {variable} placeholders with provided values.
 * Placeholders without a matching value are left unchanged.
 */
export function fillTemplate(content: string, variables: Record<string, string>): string {
  return content.replace(/\{(\w+)\}/g, (_match, key) => variables[key] ?? `{${key}}`);
}
