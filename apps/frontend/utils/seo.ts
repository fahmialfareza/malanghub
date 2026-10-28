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

export function excerpt(text: string, length = 155): string {
  const plain = stripHtml(text);
  return plain.length <= length ? plain : plain.slice(0, length).trimEnd() + "...";
}
