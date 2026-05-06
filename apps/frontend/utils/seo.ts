export const SITE_URL = "https://www.malanghub.com";

export function stripHtml(html: string): string {
  return html.replace(/<(.|\n)*?>/g, "").trim();
}

export function excerpt(text: string, length = 155): string {
  const plain = stripHtml(text);
  return plain.length <= length ? plain : plain.slice(0, length).trimEnd() + "...";
}
