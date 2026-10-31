import { NextApiRequest, NextApiResponse } from "next";
import { excerpt } from "../../utils/seo";

const SITE_URL = "https://www.malanghub.com";
const API_ADDRESS = process.env.API_ADDRESS;

const INTRO = `# Malanghub

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

const OUTRO = `## Dokumentasi Lengkap

Dokumentasi lebih lengkap untuk AI tersedia di:
\`https://www.malanghub.com/llms-full.txt\``;

interface NewsItem {
  slug?: string;
  title?: string;
  content?: string;
}

interface CategoryItem {
  slug?: string;
  name?: string;
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_ADDRESS}${path}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

// Keep titles from breaking the markdown link syntax.
function linkText(text: string): string {
  return text.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
}

function newsLines(items: NewsItem[]): string {
  return items
    .filter((item) => item.slug && item.title)
    .map((item) => {
      // Parentheses in slugs would end the markdown link early.
      const slug = item.slug!
        .replace(/-+$/, "")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
      const url = `${SITE_URL}/news/${slug}`;
      const summary = excerpt(item.content || "", 160);
      return `- [${linkText(item.title!)}](${url})${summary ? `: ${summary}` : ""}`;
    })
    .join("\n");
}

// Serves /llms.txt: the site overview plus live entry points (categories,
// latest and most-read articles) so AI crawlers can reach the content.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const listQuery = "select=slug,title,content&excerpt=1";
  const [latest, popular, categories] = await Promise.all([
    fetchList<NewsItem>(`/api/news?page=1&limit=50&sort=-created_at&${listQuery}`),
    fetchList<NewsItem>(`/api/news?page=1&limit=20&sort=-views&${listQuery}`),
    fetchList<CategoryItem>("/api/newsCategories"),
  ]);

  const sections: string[] = [INTRO];

  const categoryLines = categories
    .filter((cat) => cat.slug && cat.name)
    .map(
      (cat) =>
        `- [${linkText(cat.name!)}](${SITE_URL}/newsCategories/${cat.slug})`
    )
    .join("\n");
  if (categoryLines) sections.push(`## Daftar Kategori\n\n${categoryLines}`);

  const latestLines = newsLines(latest);
  if (latestLines) sections.push(`## Artikel Terbaru\n\n${latestLines}`);

  const popularLines = newsLines(popular);
  if (popularLines) sections.push(`## Artikel Populer\n\n${popularLines}`);

  sections.push(OUTRO);

  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400"
  );
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(sections.join("\n\n") + "\n");
}
