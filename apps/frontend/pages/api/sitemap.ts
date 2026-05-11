import { NextApiRequest, NextApiResponse } from "next";

const SITE_URL = "https://www.malanghub.com";
const API_ADDRESS = process.env.API_ADDRESS;

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

async function fetchAllNewsSlugs(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    try {
      const res = await fetch(
        `${API_ADDRESS}/api/news?page=${page}&limit=100&sort=-updated_at`
      );
      if (!res.ok) break;
      const json = await res.json();

      const items: any[] = json.data || [];
      for (const item of items) {
        if (!item.slug) continue;
        const slug = item.slug.replace(/-+$/, "");
        entries.push({
          url: `${SITE_URL}/news/${slug}`,
          lastmod: item.updated_at
            ? new Date(item.updated_at).toISOString().split("T")[0]
            : undefined,
          changefreq: "weekly",
          priority: "0.8",
        });
      }

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

async function fetchCategoryEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_ADDRESS}/api/newsCategories`);
    if (!res.ok) return [];
    const json = await res.json();
    const categories: any[] = json.data || [];
    return categories.map((cat) => ({
      url: `${SITE_URL}/newsCategories/${cat.slug}`,
      changefreq: "weekly",
      priority: "0.6",
    }));
  } catch {
    return [];
  }
}

async function fetchTagEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_ADDRESS}/api/newsTags`);
    if (!res.ok) return [];
    const json = await res.json();
    const tags: any[] = json.data || [];
    return tags.map((tag) => ({
      url: `${SITE_URL}/newsTags/${tag.slug}`,
      changefreq: "weekly",
      priority: "0.5",
    }));
  } catch {
    return [];
  }
}

function buildXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : "";
      const changefreq = e.changefreq
        ? `\n    <changefreq>${e.changefreq}</changefreq>`
        : "";
      const priority = e.priority
        ? `\n    <priority>${e.priority}</priority>`
        : "";
      return `  <url>\n    <loc>${e.url}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const staticEntries: SitemapEntry[] = [
    { url: SITE_URL, changefreq: "daily", priority: "1.0" },
    { url: `${SITE_URL}/news`, changefreq: "daily", priority: "0.9" },
    { url: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.3" },
    { url: `${SITE_URL}/terms`, changefreq: "yearly", priority: "0.2" },
    { url: `${SITE_URL}/privacy`, changefreq: "yearly", priority: "0.2" },
  ];

  const [newsEntries, categoryEntries, tagEntries] = await Promise.all([
    fetchAllNewsSlugs(),
    fetchCategoryEntries(),
    fetchTagEntries(),
  ]);

  const allEntries = [
    ...staticEntries,
    ...newsEntries,
    ...categoryEntries,
    ...tagEntries,
  ];

  const xml = buildXml(allEntries);

  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400"
  );
  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
