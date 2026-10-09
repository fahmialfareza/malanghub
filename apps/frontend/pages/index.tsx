import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import moment from "moment";
import { setActiveLink } from "../redux/actions/layoutActions";
import { Container, LoadingBlock } from "@malanghub/ui";
import {
  EmptyNews,
  SectionTitle,
  TrendingPanel,
} from "../components/news/NewsListingLayout";
import NewsItem from "../components/news/NewsItem";
import * as Sentry from "@sentry/nextjs";
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
        <title>Malanghub - Beranda</title>
        <meta name="title" content="Malanghub - Beranda" />
        <meta
          name="description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/" />
        <meta property="og:title" content="Malanghub - Beranda" />
        <meta
          property="og:description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.malanghub.com/" />
        <meta property="twitter:title" content="Malanghub - Beranda" />
        <meta
          property="twitter:description"
          content="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
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

export async function getServerSideProps() {
  const result = await Sentry.startSpan(
    { name: "index.getServerSideProps" },
    async () => {
      const configTrendingUrl = `${
        process.env.API_ADDRESS
      }/api/news?page=1&sort=-views&limit=4&created_at[gte]=${moment()
        .subtract(1, "months")
        .toISOString()}`;
      const configRecentUrl = `${process.env.API_ADDRESS}/api/news?page=1&sort=-created_at&limit=4`;

      let dataRecent = {};
      let dataTrending = {};

      try {
        const [responseRecent, responseTrending] = await Promise.all([
          fetch(configRecentUrl),
          fetch(configTrendingUrl),
        ]);

        if (!responseRecent.ok || !responseTrending.ok) {
          throw new Error("Failed to fetch data");
        }

        const recentNewsJson = await responseRecent.json();
        const trendingNewsJson = await responseTrending.json();

        dataRecent = recentNewsJson.data;
        dataTrending = trendingNewsJson.data;
      } catch (e) {
        Sentry.captureException(e);
        return {
          notFound: true,
        };
      }

      return { props: { recentNews: dataRecent, trendingNews: dataTrending } };
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
});

export default connect(mapStateToProps, { setActiveLink })(Home);
