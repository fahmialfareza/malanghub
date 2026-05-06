import { NextApiRequest, NextApiResponse } from "next";
import { excerpt, stripHtml } from "../../utils/seo";

const SITE_URL = "https://www.malanghub.com";
const API_ADDRESS = process.env.API_ADDRESS;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(items: any[]): string {
  const pubDate = new Date().toUTCString();

  const entries = items
    .map((item) => {
      const link = `${SITE_URL}/news/${item.slug}`;
      const title = escapeXml(item.title || "");
      const description = escapeXml(excerpt(item.content || "", 300));
      const itemPubDate = item.created_at
        ? new Date(item.created_at).toUTCString()
        : pubDate;
      const category = item.category?.name
        ? `<category>${escapeXml(item.category.name)}</category>`
        : "";
      const image = item.mainImage
        ? `<enclosure url="${item.mainImage}" length="0" type="image/jpeg" />`
        : "";
      const author = item.user?.name
        ? `<author>${escapeXml(item.user.name)}</author>`
        : "";

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${itemPubDate}</pubDate>
      ${category}
      ${author}
      ${image}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Malanghub</title>
    <link>${SITE_URL}</link>
    <description>Berita dan informasi terkini seputar Malang Raya - Kota Malang, Kabupaten Malang, dan Kota Batu.</description>
    <language>id</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo512.png</url>
      <title>Malanghub</title>
      <link>${SITE_URL}</link>
    </image>
${entries}
  </channel>
</rss>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      `${API_ADDRESS}/api/news?page=1&limit=20&sort=-created_at`
    );
    if (!response.ok) throw new Error("Failed to fetch news");

    const json = await response.json();
    const items: any[] = json.data || [];
    const xml = buildRss(items);

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.status(200).send(xml);
  } catch {
    res.status(500).send("Error generating RSS feed");
  }
}
