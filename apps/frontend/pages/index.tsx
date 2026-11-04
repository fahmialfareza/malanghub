import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import { setActiveLink } from "../redux/actions/layoutActions";
import { Container, LoadingBlock } from "@malanghub/ui";
import {
  EmptyNews,
  SectionTitle,
  TrendingPanel,
} from "../components/news/NewsListingLayout";
import NewsItem from "../components/news/NewsItem";
import { fetchJson } from "../utils/pagination";
import { RootState } from "../redux/store";
import { News } from "../models/news";
import { NewsReducerState } from "../redux/types";

interface HomeProps {
  recentNews: News[];
  trendingNews: News[];
  news: NewsReducerState;
  setActiveLink: (link: string) => void;
}

const Home = ({
  recentNews,
  trendingNews,
  news: { loading: newsLoading },
  setActiveLink,
}: HomeProps) => {
  useEffect(() => {
    setActiveLink("home");
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Berita dan Informasi Terkini Malang Raya</title>
        <meta
          name="title"
          content="Malanghub - Berita dan Informasi Terkini Malang Raya"
        />
        <meta
          name="description"
          content="Berita, opini, dan informasi terkini seputar Malang Raya: Kota Malang, Kabupaten Malang, dan Kota Batu. Ditulis oleh warga, mahasiswa, dan komunitas lokal."
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/" />
        <meta
          property="og:title"
          content="Malanghub - Berita dan Informasi Terkini Malang Raya"
        />
        <meta
          property="og:description"
          content="Berita, opini, dan informasi terkini seputar Malang Raya: Kota Malang, Kabupaten Malang, dan Kota Batu. Ditulis oleh warga, mahasiswa, dan komunitas lokal."
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.malanghub.com/" />
        <meta
          property="twitter:title"
          content="Malanghub - Berita dan Informasi Terkini Malang Raya"
        />
        <meta
          property="twitter:description"
          content="Berita, opini, dan informasi terkini seputar Malang Raya: Kota Malang, Kabupaten Malang, dan Kota Batu. Ditulis oleh warga, mahasiswa, dan komunitas lokal."
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <link rel="canonical" href="https://www.malanghub.com/" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.malanghub.com/#website",
                  url: "https://www.malanghub.com/",
                  name: "Malanghub",
                  description:
                    "Situs berita dan informasi terkini seputar Malang Raya",
                  inLanguage: "id-ID",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://www.malanghub.com/search/{search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.malanghub.com/#organization",
                  name: "Malanghub",
                  url: "https://www.malanghub.com/",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.malanghub.com/logo512.png",
                    width: 512,
                    height: 512,
                  },
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    availableLanguage: "Indonesian",
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <Container className="py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
          <main className="min-w-0">
            <SectionTitle as="h1">Berita Terbaru</SectionTitle>
            {newsLoading || recentNews === null ? (
              <LoadingBlock />
            ) : recentNews?.length > 0 ? (
              <NewsItem news={recentNews} />
            ) : (
              <EmptyNews>Belum Ada Berita</EmptyNews>
            )}
          </main>

          <aside className="min-w-0">
            <div className="lg:sticky lg:top-24">
              <TrendingPanel news={trendingNews} loading={newsLoading} />
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
};

// Prerendered at build time; the site is rebuilt whenever content changes.
// An API failure fails the build, so a broken homepage is never deployed.
export async function getStaticProps() {
  const configTrendingUrl = `${
    process.env.API_ADDRESS
  }/api/news?page=1&sort=-views&limit=4&excerpt=1`;
  const configRecentUrl = `${process.env.API_ADDRESS}/api/news?page=1&sort=-created_at&limit=4&excerpt=1`;

  const [recentNewsJson, trendingNewsJson] = await Promise.all([
    fetchJson(configRecentUrl),
    fetchJson(configTrendingUrl),
  ]);

  return {
    props: {
      recentNews: recentNewsJson.data,
      trendingNews: trendingNewsJson.data,
    },
  };
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { setActiveLink })(Home);
