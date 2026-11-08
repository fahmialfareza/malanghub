// Crawler-facing files written into the static export by
// scripts/generate-seo-files.mts: sitemap.xml, news-sitemap.xml, feed.xml
// and llms.txt. They are rebuilt with the site whenever content changes.
//
// Imports use the `.ts` extension so Node can run this file directly.
import { fetchAllNews, fetchList } from "./apiList.ts";
import { SITE_URL, articleSummary, cdata, escapeXml, excerpt } from "./seo.ts";

// ---------------------------------------------------------------- sitemap

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function buildUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : "";
      const changefreq = e.changefreq
        ? `\n    <changefreq>${e.changefreq}</changefreq>`
        : "";
      const priority = e.priority
        ? `\n    <priority>${e.priority}</priority>`
        : "";
      return `  <url>\n    <loc>${escapeXml(e.url)}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export async function buildSitemap(): Promise<string> {
  const [news, categories, tags] = await Promise.all([
    fetchAllNews<{ slug?: string; updated_at?: string }>(
      "sort=-updated_at&select=slug,updated_at",
    ),
    fetchList<{ slug?: string }>("/api/newsCategories"),
    fetchList<{ slug?: string }>("/api/newsTags"),
  ]);

  if (news.length === 0) {
    throw new Error("Refusing to write a sitemap without articles");
  }

  const entries: SitemapEntry[] = [
    { url: SITE_URL, changefreq: "daily", priority: "1.0" },
    { url: `${SITE_URL}/news`, changefreq: "daily", priority: "0.9" },
    { url: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.3" },
    { url: `${SITE_URL}/terms`, changefreq: "yearly", priority: "0.2" },
    { url: `${SITE_URL}/privacy`, changefreq: "yearly", priority: "0.2" },
    ...news
      .filter((item) => item.slug)
      .map((item) => ({
        url: `${SITE_URL}/news/${item.slug}`,
        lastmod: item.updated_at
          ? new Date(item.updated_at).toISOString().split("T")[0]
          : undefined,
        changefreq: "weekly",
        priority: "0.8",
      })),
    ...categories
      .filter((cat) => cat.slug)
      .map((cat) => ({
        url: `${SITE_URL}/newsCategories/${cat.slug}`,
        changefreq: "weekly",
        priority: "0.6",
      })),
    ...tags
      .filter((tag) => tag.slug)
      .map((tag) => ({
        url: `${SITE_URL}/newsTags/${tag.slug}`,
        changefreq: "weekly",
        priority: "0.5",
      })),
  ];

  return buildUrlset(entries);
}

// ----------------------------------------------------------- news sitemap

// Google News reads articles from the last 2 days. On quiet days the latest
// few are listed instead: Google ignores old entries, but reports an empty
// <urlset> as a "Missing XML tag" error.
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const NEWS_FALLBACK_LIMIT = 10;

interface NewsSitemapItem {
  slug?: string;
  title?: string;
  created_at?: string;
}

export async function buildNewsSitemap(): Promise<string> {
  const items = await fetchList<NewsSitemapItem>(
    "/api/news?page=1&limit=100&sort=-created_at&select=slug,title,created_at",
  );

  const cutoff = Date.now() - TWO_DAYS_MS;
  const valid = items.filter(
    (item) => item.slug && item.title && item.created_at,
  );
  const recent = valid.filter(
    (item) => new Date(item.created_at!).getTime() >= cutoff,
  );
  const entries =
    recent.length > 0 ? recent : valid.slice(0, NEWS_FALLBACK_LIMIT);

  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(`${SITE_URL}/news/${e.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Malanghub</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${new Date(e.created_at!).toISOString()}</news:publication_date>
      <news:title>${escapeXml(e.title!)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>`;
}

// -------------------------------------------------------------------- RSS

export async function buildFeed(): Promise<string> {
  const items = await fetchList<any>(
    "/api/news?page=1&limit=20&sort=-created_at",
  );
  const pubDate = new Date().toUTCString();

  const entries = items
    .map((item) => {
      const link = escapeXml(`${SITE_URL}/news/${item.slug}`);
      const title = escapeXml(item.title || "");
      const description = escapeXml(
        articleSummary(item.content || "", item.title, 300),
      );
      const itemPubDate = item.created_at
        ? new Date(item.created_at).toUTCString()
        : pubDate;
      const category = item.category?.name
        ? `<category>${escapeXml(item.category.name)}</category>`
        : "";
      const tagCategories = Array.isArray(item.tags)
        ? item.tags
            .filter((t: any) => t?.name)
            .map((t: any) => `<category>${escapeXml(t.name)}</category>`)
            .join("\n      ")
        : "";
      const image = item.mainImage
        ? `<enclosure url="${escapeXml(item.mainImage)}" length="0" type="image/jpeg" />`
        : "";
      const author = item.user?.name
        ? `<author>${escapeXml(item.user.name)}</author>`
        : "";
      const fullContent = item.content
        ? `<content:encoded>${cdata(item.content)}</content:encoded>`
        : "";

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${itemPubDate}</pubDate>
      ${category}
      ${tagCategories}
      ${author}
      ${image}
      ${fullContent}
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

// --------------------------------------------------------------- llms.txt

const LLMS_INTRO = `# Malanghub

> Malanghub adalah portal berita dan informasi terkini seputar Malang Raya, mencakup Kota Malang, Kabupaten Malang, dan Kota Batu, Jawa Timur, Indonesia.

Malanghub menyediakan berita lokal, informasi komunitas, dan liputan peristiwa di kawasan Malang Raya. Seluruh konten ditulis dalam Bahasa Indonesia.

## Halaman Utama

- [Beranda](https://www.malanghub.com/): Berita terbaru dan berita trending dari seluruh Malang Raya
- [Semua Berita](https://www.malanghub.com/news): Arsip seluruh berita yang telah diterbitkan
- [Kontak](https://www.malanghub.com/contact): Informasi kontak dan alamat redaksi
- [Syarat dan Ketentuan](https://www.malanghub.com/terms): Syarat penggunaan layanan Malanghub
- [Kebijakan Privasi](https://www.malanghub.com/privacy): Kebijakan privasi dan penggunaan data

## Artikel Berita

Setiap artikel berita dapat diakses di:
\`https://www.malanghub.com/news/{slug-berita}\`

Artikel berisi: judul, penulis, kategori, tag, tanggal publikasi, dan konten lengkap.

## Kategori Berita

Berita dikelompokkan ke dalam beberapa kategori. Setiap kategori memiliki halaman tersendiri di:
\`https://www.malanghub.com/newsCategories/{slug-kategori}\`

## Tag Berita

Berita juga ditandai dengan tag untuk memudahkan navigasi. Setiap tag dapat diakses di:
\`https://www.malanghub.com/newsTags/{slug-tag}\`

## Sitemap

Daftar lengkap semua URL yang dapat diindeks tersedia di:
\`https://www.malanghub.com/sitemap.xml\`

## Informasi Teknis

- Bahasa konten: Bahasa Indonesia (id-ID)
- Wilayah liputan: Malang Raya (Kota Malang, Kabupaten Malang, Kota Batu)
- Provinsi: Jawa Timur, Indonesia
- Frekuensi pembaruan: Harian`;

const LLMS_OUTRO = `## Dokumentasi Lengkap

Dokumentasi lebih lengkap untuk AI tersedia di:
\`https://www.malanghub.com/llms-full.txt\``;

interface LlmsNewsItem {
  slug?: string;
  title?: string;
  content?: string;
}

// Keep titles from breaking the markdown link syntax.
function linkText(text: string): string {
  return text.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
}

function newsLines(items: LlmsNewsItem[]): string {
  return items
    .filter((item) => item.slug && item.title)
    .map((item) => {
      // Parentheses in slugs would end the markdown link early.
      const slug = item
        .slug!.replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
      const summary = excerpt(item.content || "", 160);
      return `- [${linkText(item.title!)}](${SITE_URL}/news/${slug})${summary ? `: ${summary}` : ""}`;
    })
    .join("\n");
}

// The site overview plus entry points (categories, latest and most-read
// articles) so AI crawlers can reach the content.
export async function buildLlms(): Promise<string> {
  const listQuery = "select=slug,title,content&excerpt=1";
  const [latest, popular, categories] = await Promise.all([
    fetchList<LlmsNewsItem>(
      `/api/news?page=1&limit=50&sort=-created_at&${listQuery}`,
    ),
    fetchList<LlmsNewsItem>(`/api/news?page=1&limit=20&sort=-views&${listQuery}`),
    fetchList<{ slug?: string; name?: string }>("/api/newsCategories"),
  ]);

  const sections: string[] = [LLMS_INTRO];

  const categoryLines = categories
    .filter((cat) => cat.slug && cat.name)
    .map(
      (cat) =>
        `- [${linkText(cat.name!)}](${SITE_URL}/newsCategories/${cat.slug})`,
    )
    .join("\n");
  if (categoryLines) sections.push(`## Daftar Kategori\n\n${categoryLines}`);

  const latestLines = newsLines(latest);
  if (latestLines) sections.push(`## Artikel Terbaru\n\n${latestLines}`);

  const popularLines = newsLines(popular);
  if (popularLines) sections.push(`## Artikel Populer\n\n${popularLines}`);

  sections.push(LLMS_OUTRO);

  return sections.join("\n\n") + "\n";
}
