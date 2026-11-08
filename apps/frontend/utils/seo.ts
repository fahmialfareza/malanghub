export const SITE_URL = "https://www.malanghub.com";

export function stripHtml(html: string): string {
  return html.replace(/<(.|\n)*?>/g, "").trim();
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Split "]]>" so stored content cannot terminate a CDATA section early.
export function cdata(str: string): string {
  return `<![CDATA[${str.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
};

// Editor HTML as a single line of readable text, for meta tags and JSON-LD.
export function plainText(html: string): string {
  return stripHtml(html)
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code =
          entity[1].toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return code >= 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text: string, length = 155): string {
  return truncate(plainText(text), length);
}

// Cuts plain text to `length` on a word boundary and adds "...".
function truncate(plain: string, length: number): string {
  if (plain.length <= length) return plain;
  const cut = plain.slice(0, length);
  // Don't end mid-word unless the only space is near the start.
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut;
  return trimmed.replace(/[\s,.;:!?-]+$/, "") + "...";
}

const BYLINE = /^(oleh|penulis|ditulis oleh|reporter|editor)\b/i;
const BLOCK_END = /<\/(?:p|h[1-6]|div|li|blockquote)>|<br\s*\/?>/i;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/g, " ")
    .trim();

// Share of cased letters that are uppercase (0 when there are fewer than 10).
function upperRatio(text: string): number {
  let letters = 0;
  let upper = 0;
  for (const ch of text.split("")) {
    if (ch.toLowerCase() === ch.toUpperCase()) continue;
    letters++;
    if (ch === ch.toUpperCase()) upper++;
  }
  return letters >= 10 ? upper / letters : 0;
}

// Opening blocks that make a poor search snippet: bylines, ALL-CAPS banners,
// a repeat of the title and short headings.
function isPreamble(text: string, title: string): boolean {
  if (!text || BYLINE.test(text)) return true;
  if (upperRatio(text) >= 0.7) return true;
  const block = normalize(text);
  const heading = normalize(title);
  if (block && heading && (block === heading || heading.includes(block))) {
    return true;
  }
  // A short line ending in ":" introduces the list after it; keep it.
  return text.length < 80 && !/[.!?:]$|[.!?]/.test(text);
}

/**
 * Meta description for an article: the text from its first real paragraph,
 * skipping the heading/byline preamble many submissions start with. Falls
 * back to the plain excerpt when every block looks like preamble.
 */
export function articleSummary(html: string, title = "", length = 155): string {
  const blocks = html.split(BLOCK_END).map(plainText);
  const start = blocks.findIndex((text) => !isPreamble(text, title));
  if (start < 0) return excerpt(html, length);
  return truncate(blocks.slice(start).filter(Boolean).join(" "), length);
}

// Build-time fetches (pages, sitemaps, feed, llms.txt) retry transient
// failures so one blip doesn't fail the whole build. The body is read inside
// the retry loop: a connection dropped mid-response must be retried too.
export async function fetchWithRetry(
  url: string,
  attempts = 4,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 500 * 2 ** (i - 1)));
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        const body = await res.arrayBuffer();
        return new Response(body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
