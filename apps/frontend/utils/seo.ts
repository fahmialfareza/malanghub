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
  const plain = plainText(text);
  if (plain.length <= length) return plain;
  const cut = plain.slice(0, length);
  // Don't end mid-word unless the only space is near the start.
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut;
  return trimmed.replace(/[\s,.;:!?-]+$/, "") + "...";
}
