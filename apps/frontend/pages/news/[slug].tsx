import { useEffect, useRef } from "react";
import Head from "next/head";
import { excerpt } from "../../utils/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { connect } from "react-redux";
import Moment from "react-moment";
import parse from "html-react-parser";
import { setActiveLink } from "../../redux/actions/layoutActions";
import RelatedNews from "../../components/news/RelatedNews";
import { CategoryBadge } from "../../components/news/NewsCard";
import {
  EmptyNews,
  SectionTitle,
  renderNextLink,
} from "../../components/news/NewsListingLayout";
import { Breadcrumbs, Container, badgeClass, cx } from "@malanghub/ui";
import * as Sentry from "@sentry/nextjs";
import { RootState } from "../../redux/store";
import { GetServerSidePropsContext } from "next";
import { UserReducerState } from "../../redux/types";
import { News, NewsCategory, NewsTag } from "../../models/news";
import { User } from "../../models/user";

const shareButtonClass =
  "inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-body no-underline transition-colors hover:border-brand hover:bg-brand hover:text-brand-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

// Readable typography for the article HTML coming from the editor.
const articleBodyClass = cx(
  "break-words font-sans text-[1.06rem] leading-8 text-body",
  "[&_p]:mb-5 [&_p]:text-[1.06rem] [&_p]:leading-8 [&_p]:text-body",
  "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-fg",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-fg",
  "[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-heading [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-fg",
  "[&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:decoration-brand/40 [&_a]:underline-offset-2 [&_a:hover]:decoration-brand",
  "[&_strong]:text-fg [&_b]:text-fg",
  "[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_li]:leading-7 [&_li::marker]:text-brand",
  "[&_blockquote]:my-8 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:bg-brand-soft [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:text-lg [&_blockquote]:italic [&_blockquote]:text-fg [&_blockquote_p]:mb-0",
  "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl",
  "[&_figure]:my-8 [&_figure]:mx-0 [&_figure_img]:my-0 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted",
  "[&_iframe]:my-6 [&_iframe]:max-w-full [&_iframe]:rounded-xl",
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-surface-2 [&_th]:p-2",
  "[&_hr]:my-10 [&_hr]:border-line",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
);

interface SingleNewsProps {
  currentNews: News;
  relatedNews: News[];
  setActiveLink: (link: string) => void;
}

const SingleNews = ({
  currentNews,
  relatedNews,
  setActiveLink,
}: SingleNewsProps) => {
  const router = useRouter();
  const { slug } = router.query;

  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveLink("news");
  }, []);

  useEffect(() => {
    if (contentRef && contentRef.current) {
      contentRef.current.querySelectorAll("*").forEach(function (
        node: Element,
      ) {
        node.removeAttribute("style");
      });
    }
  }, [contentRef, currentNews]);

  return (
    <>
      <Head>
        <title>Malanghub - Berita - {currentNews?.title}</title>
        <meta
          name="title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          name="description"
          content={excerpt(currentNews?.content || "", 155)}
        />

        <link
          rel="canonical"
          href={`https://www.malanghub.com/news/${currentNews?.slug}`}
        />

        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://www.malanghub.com/news/${currentNews?.slug}`}
        />
        <meta
          property="og:title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          property="og:description"
          content={excerpt(currentNews?.content || "", 155)}
        />
        <meta property="og:image" content={currentNews?.mainImage} />
        {currentNews?.created_at && (
          <meta
            property="article:published_time"
            content={new Date(currentNews.created_at).toISOString()}
          />
        )}
        {currentNews?.updated_at && (
          <meta
            property="article:modified_time"
            content={new Date(currentNews.updated_at).toISOString()}
          />
        )}
        {currentNews?.user?.name && (
          <meta property="article:author" content={currentNews.user.name} />
        )}
        {currentNews?.category?.name && (
          <meta
            property="article:section"
            content={currentNews.category.name}
          />
        )}
        {Array.isArray(currentNews?.tags) &&
          currentNews.tags.map((tag: any) =>
            tag?.name ? (
              <meta
                key={tag._id || tag.name}
                property="article:tag"
                content={tag.name}
              />
            ) : null,
          )}

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://www.malanghub.com/news/${currentNews?.slug}`}
        />
        <meta
          property="twitter:title"
          content={`Malanghub - Berita - ${currentNews?.title}`}
        />
        <meta
          property="twitter:description"
          content={excerpt(currentNews?.content || "", 155)}
        />
        <meta property="twitter:image" content={currentNews?.mainImage} />
        {currentNews?.user?.name && (
          <meta name="twitter:label1" content="Penulis" />
        )}
        {currentNews?.user?.name && (
          <meta name="twitter:data1" content={currentNews.user.name} />
        )}
        {currentNews?.time_read && (
          <meta name="twitter:label2" content="Waktu Baca" />
        )}
        {currentNews?.time_read && (
          <meta
            name="twitter:data2"
            content={`${Math.ceil(currentNews.time_read / 10)} menit`}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: currentNews?.title,
              description: excerpt(currentNews?.content || "", 155),
              image: currentNews?.mainImage
                ? [{ "@type": "ImageObject", url: currentNews.mainImage }]
                : undefined,
              isAccessibleForFree: "True",
              datePublished: currentNews?.created_at
                ? new Date(currentNews.created_at).toISOString()
                : undefined,
              dateModified: currentNews?.updated_at
                ? new Date(currentNews.updated_at).toISOString()
                : currentNews?.created_at
                  ? new Date(currentNews.created_at).toISOString()
                  : undefined,
              author: currentNews?.user
                ? {
                    "@type": "Person",
                    name: currentNews.user.name,
                    url: currentNews.user._id
                      ? `https://www.malanghub.com/users/${currentNews.user._id}`
                      : undefined,
                  }
                : undefined,
              publisher: {
                "@type": "Organization",
                name: "Malanghub",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.malanghub.com/logo-wide.png",
                  width: 300,
                  height: 60,
                },
              },
              url: `https://www.malanghub.com/news/${currentNews?.slug}`,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://www.malanghub.com/news/${currentNews?.slug}`,
              },
              articleSection: currentNews?.category?.name,
              keywords: Array.isArray(currentNews?.tags)
                ? currentNews.tags
                    .map((tag: any) => tag?.name)
                    .filter(Boolean)
                    .join(", ")
                : undefined,
              articleBody: currentNews?.content
                ? currentNews.content.replace(/<(.|\n)*?>/g, "").trim()
                : undefined,
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [".blog-desc-big", ".single-post-content p"],
              },
              inLanguage: "id-ID",
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Beranda",
                  item: "https://www.malanghub.com/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Berita",
                  item: "https://www.malanghub.com/news",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: currentNews?.title,
                  item: `https://www.malanghub.com/news/${currentNews?.slug}`,
                },
              ],
            }),
          }}
        />
      </Head>

      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: "/news" },
          { label: currentNews && currentNews.title },
        ]}
        renderLink={renderNextLink}
      />

      <main>
        <article className="mx-auto w-full max-w-3xl px-4 pt-10 pb-12 sm:px-6 lg:pt-14">
          <header className="mb-8">
            {currentNews?.category && (
              <CategoryBadge news={currentNews} className="mb-4" />
            )}
            <h1 className="blog-desc-big m-0 mb-6 font-heading text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl lg:text-[2.75rem]">
              {currentNews?.title}
            </h1>

            <div className="flex items-center gap-3">
              {currentNews?.user && (
                <Link
                  href={`/users${currentNews?.user?._id ? `/${currentNews?.user?._id}` : ""}`}
                  className="relative block size-11 shrink-0 overflow-hidden rounded-full bg-surface-2 ring-2 ring-line"
                  aria-hidden
                  tabIndex={-1}
                >
                  {currentNews?.user?.photo && (
                    <Image
                      src={currentNews.user.photo}
                      alt=""
                      className="object-cover"
                      sizes="44px"
                      fill
                    />
                  )}
                </Link>
              )}
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                {currentNews?.user && (
                  <Link
                    href={`/users${currentNews?.user?._id ? `/${currentNews?.user?._id}` : ""}`}
                    className="font-semibold text-fg no-underline hover:text-brand"
                  >
                    {currentNews?.user?.name}
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-x-2 text-muted">
                  <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                    {currentNews?.created_at}
                  </Moment>
                  <span aria-hidden className="text-line-strong">
                    &middot;
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="fa fa-clock-o" aria-hidden="true"></span>
                    {currentNews && Math.ceil(currentNews.time_read / 10)} menit
                  </span>
                </div>
              </div>
            </div>
          </header>

          {currentNews?.mainImage && (
            <figure className="relative m-0 mb-10 aspect-video overflow-hidden rounded-2xl bg-surface-2 shadow-card sm:-mx-6 lg:-mx-16">
              <Image
                src={currentNews.mainImage}
                className="object-cover"
                alt={currentNews.title}
                sizes="(min-width: 1024px) 896px, 100vw"
                priority
                fill
              />
            </figure>
          )}

          <div className="single-post-content">
            {currentNews && currentNews.content && (
              <div ref={contentRef} className={articleBodyClass}>
                {parse(currentNews.content)}
              </div>
            )}
          </div>

          <footer className="mt-12 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-fg">
                Tag :
              </span>
              {currentNews?.tags &&
                currentNews?.tags.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/newsTags/${tag.slug}`}
                    className={badgeClass(
                      "neutral",
                      "px-3 py-1 transition-colors hover:bg-brand-soft hover:text-brand",
                    )}
                  >
                    #{tag.name}
                  </Link>
                ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-fg">
                Bagikan :
              </span>
              <a
                target="_blank"
                rel="noreferrer"
                aria-label="Bagikan ke Facebook"
                className={shareButtonClass}
                href={`https://www.facebook.com/share.php?u=https://www.malanghub.com/news/${slug}`}
              >
                <span className="fa fa-facebook" aria-hidden="true"></span>
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                aria-label="Bagikan ke Twitter"
                className={shareButtonClass}
                href={`https://twitter.com/intent/tweet?text=https://www.malanghub.com/news/${slug}`}
              >
                <span className="fa fa-twitter" aria-hidden="true"></span>
              </a>
            </div>
          </footer>

          {currentNews?.user && (
            <section className="mt-10 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-start">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-surface-2">
                {currentNews?.user?.photo && (
                  <Image
                    src={currentNews.user.photo}
                    alt=""
                    className="object-cover"
                    sizes="80px"
                    fill
                  />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="m-0 mb-2 font-heading text-xl font-bold text-fg">
                  {currentNews?.user?.name}
                </h2>
                {currentNews?.user?.bio && (
                  <p className="m-0 text-[0.95rem] leading-relaxed text-body">
                    {currentNews?.user?.bio}
                  </p>
                )}
                <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                  {currentNews?.user?.facebook && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Facebook"
                        className={shareButtonClass}
                        href={currentNews?.user?.facebook}
                      >
                        <span
                          className="fab fa-facebook"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )}
                  {currentNews?.user?.twitter && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Twitter"
                        className={shareButtonClass}
                        href={`https://twitter.com/${currentNews?.user?.twitter}`}
                      >
                        <span
                          className="fab fa-twitter"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )}
                  {currentNews?.user?.instagram && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className={shareButtonClass}
                        href={`https://instagram.com/${currentNews?.user?.instagram}`}
                      >
                        <span
                          className="fab fa-instagram"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )}
                  {currentNews?.user?.linkedin && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                        className={shareButtonClass}
                        href={currentNews?.user?.linkedin}
                      >
                        <span
                          className="fab fa-linkedin"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )}
                  {currentNews?.user?.tiktok && (
                    <li>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        aria-label="TikTok"
                        className={shareButtonClass}
                        href={`https://www.tiktok.com/@${currentNews?.user?.tiktok}`}
                      >
                        <span
                          className="fab fa-tiktok"
                          aria-hidden="true"
                        ></span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </section>
          )}
        </article>

        <section className="border-t border-line bg-surface-2/50">
          <Container className="py-12 lg:py-16">
            <SectionTitle>Mungkin Anda Tertarik</SectionTitle>
            {relatedNews?.length > 0 ? (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {relatedNews.map((news, index) => {
                  return (
                    <RelatedNews key={news._id} index={index} news={news} />
                  );
                })}
              </div>
            ) : (
              <EmptyNews>Belum Ada Berita</EmptyNews>
            )}
          </Container>
        </section>
      </main>

      <div className="display-ad mx-auto my-2 block text-center"></div>
    </>
  );
};

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext<{ slug: string }>) {
  const rawSlug = params?.slug;
  const cleanSlug = rawSlug?.replace(/-+$/, "");

  if (cleanSlug && cleanSlug !== rawSlug) {
    return {
      redirect: {
        destination: `/news/${cleanSlug}`,
        permanent: true,
      },
    };
  }

  const result = await Sentry.startSpan(
    {
      name: "news.[slug].getServerSideProps",
    },
    async () => {
      let data = [];

      try {
        // Fetch the current news item based on the slug
        const currentNewsResponse = await fetch(
          `${process.env.API_ADDRESS}/api/news/${rawSlug}`,
        );

        if (!currentNewsResponse.ok) {
          throw new Error("Failed to fetch current news");
        }

        const currentNewsJson = await currentNewsResponse.json();
        data.push(currentNewsJson.data);

        // Fetch related news items
        const relatedNewsUrl = `${process.env.API_ADDRESS}/api/news?page=1&sort=-views&limit=4&category=${data[0].category._id}&_id[ne]=${data[0]._id}`;
        const relatedNewsResponse = await fetch(relatedNewsUrl);

        if (relatedNewsResponse.ok) {
          const relatedNewsJson = await relatedNewsResponse.json();
          data.push(relatedNewsJson.data);
        } else {
          throw new Error("Failed to fetch related news");
        }
      } catch (e) {
        Sentry.captureException(e);

        if (data.length > 0) {
          // Return the current news with null related news if fetching related news fails
          return { props: { currentNews: data[0], relatedNews: null } };
        } else {
          // If fetching the current news fails, return a 404 page
          return { notFound: true };
        }
      }

      // Return the current news and related news as props
      return { props: { currentNews: data[0], relatedNews: data[1] } };
    },
  );

  return result;
}

const mapStateToProps = (state: RootState) => ({
  news: state.news,
  user: state.user,
});

export default connect(mapStateToProps, {
  setActiveLink,
})(SingleNews);
