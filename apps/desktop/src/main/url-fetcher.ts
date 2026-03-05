/** Fetch a URL and extract title, description, and text content */
export async function fetchUrlContent(url: string): Promise<{
  title: string;
  description: string;
  text: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GhostClip/1.0 (Clipboard AI)",
        "Accept": "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      // Non-HTML (PDF, image, etc.) — just return basic info
      return {
        title: new URL(url).hostname,
        description: `${contentType.split(";")[0]} Datei`,
        text: "",
      };
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : new URL(url).hostname;

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch ? decodeEntities(descMatch[1].trim()) : "";

    // Extract og:description as fallback
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);
    const ogDesc = ogDescMatch ? decodeEntities(ogDescMatch[1].trim()) : "";

    // Extract main text content (strip tags, scripts, styles)
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Take first ~2000 chars of meaningful text
    const text = cleaned.slice(0, 2000);

    return {
      title,
      description: description || ogDesc,
      text,
    };
  } catch (err: any) {
    console.log(`URL fetch failed for ${url}: ${err.message}`);
    return null;
  }
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
