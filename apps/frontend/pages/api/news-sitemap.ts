import { NextApiRequest, NextApiResponse } from "next";
import { escapeXml } from "../../utils/seo";

const SITE_URL = "https://www.malanghub.com";
const API_ADDRESS = process.env.API_ADDRESS;
const PUBLICATION_NAME = "Malanghub";
const PUBLICATION_LANGUAGE = "id";

// Google News only accepts articles from the last 2 days; older entries are
// reported as errors, so the sitemap is left empty on quiet days.
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

interface NewsEntry {
  slug: string;
  title: string;
  created_at: string;
}

// Returns null when the API is unavailable, so the handler can answer 503
// instead of publishing an empty sitemap.
async function fetchRecentNews(): Promise<NewsEntry[] | null> {
  const cutoff = Date.now() - TWO_DAYS_MS;
  const recent: NewsEntry[] = [];

  try {
    const res = await fetch(
      `${API_ADDRESS}/api/news?page=1&limit=100&sort=-created_at&select=slug,title,created_at`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const items: any[] = json.data || [];

    for (const item of items) {
      if (!item.slug || !item.title || !item.created_at) continue;
      if (new Date(item.created_at).getTime() < cutoff) continue;
      recent.push({
        slug: item.slug.replace(/-+$/, ""),
        title: item.title,
        created_at: item.created_at,
      });
    }
  } catch {
    return null;
  }

  return recent;
}

function buildNewsXml(entries: NewsEntry[]): string {
  const urls = entries
    .map((e) => {
      const pubDate = new Date(e.created_at).toISOString();
      return `  <url>
    <loc>${escapeXml(`${SITE_URL}/news/${e.slug}`)}</loc>
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

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const entries = await fetchRecentNews();
  if (!entries) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", "600");
    res.status(503).send("Sitemap temporarily unavailable");
    return;
  }
  const xml = buildNewsXml(entries);

  // Cache for 1 hour — Google crawls news sitemaps frequently
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
