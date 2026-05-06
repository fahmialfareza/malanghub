import { NextApiRequest, NextApiResponse } from "next";

const SITE_URL = "https://www.malanghub.com";
const API_ADDRESS = process.env.API_ADDRESS;
const PUBLICATION_NAME = "Malanghub";
const PUBLICATION_LANGUAGE = "id";

// Google News sitemap only covers articles from the last 2 days
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

interface NewsEntry {
  slug: string;
  title: string;
  created_at: string;
}

async function fetchRecentNews(): Promise<NewsEntry[]> {
  const cutoff = new Date(Date.now() - TWO_DAYS_MS).toISOString();
  const entries: NewsEntry[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    try {
      const res = await fetch(
        `${API_ADDRESS}/api/news?page=${page}&limit=100&sort=-created_at`
      );
      if (!res.ok) break;
      const json = await res.json();

      const items: any[] = json.data || [];
      let reachedOld = false;

      for (const item of items) {
        if (item.created_at && item.created_at < cutoff) {
          reachedOld = true;
          break;
        }
        if (item.slug && item.title && item.created_at) {
          entries.push({
            slug: item.slug,
            title: item.title,
            created_at: item.created_at,
          });
        }
      }

      if (reachedOld) break;

      const total: number = json.meta?.total || items.length;
      const limit: number = json.meta?.limit || 100;
      totalPages = Math.ceil(total / limit);
      page++;
    } catch {
      break;
    }
  } while (page <= totalPages);

  return entries;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildNewsXml(entries: NewsEntry[]): string {
  if (entries.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n</urlset>`;
  }

  const urls = entries
    .map((e) => {
      const pubDate = new Date(e.created_at).toISOString();
      return `  <url>
    <loc>${SITE_URL}/news/${e.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(e.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const entries = await fetchRecentNews();
  const xml = buildNewsXml(entries);

  // Cache for 1 hour — Google crawls news sitemaps frequently
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
