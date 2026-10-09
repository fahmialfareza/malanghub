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
  "tw:inline-flex tw:size-9 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:bg-brand tw:hover:text-brand-fg tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring";

// Readable typography for the article HTML coming from the editor.
const articleBodyClass = cx(
  "tw:break-words tw:font-sans tw:text-[1.06rem] tw:leading-8 tw:text-body",
  "tw:[&_p]:mb-5 tw:[&_p]:text-[1.06rem] tw:[&_p]:leading-8 tw:[&_p]:text-body",
  "tw:[&_h2]:mt-10 tw:[&_h2]:mb-4 tw:[&_h2]:font-heading tw:[&_h2]:text-2xl tw:[&_h2]:font-bold tw:[&_h2]:leading-snug tw:[&_h2]:text-fg",
  "tw:[&_h3]:mt-8 tw:[&_h3]:mb-3 tw:[&_h3]:font-heading tw:[&_h3]:text-xl tw:[&_h3]:font-bold tw:[&_h3]:leading-snug tw:[&_h3]:text-fg",
  "tw:[&_h4]:mt-6 tw:[&_h4]:mb-2 tw:[&_h4]:font-heading tw:[&_h4]:text-lg tw:[&_h4]:font-semibold tw:[&_h4]:text-fg",
  "tw:[&_a]:font-semibold tw:[&_a]:text-brand tw:[&_a]:underline tw:[&_a]:decoration-brand/40 tw:[&_a]:underline-offset-2 tw:[&_a:hover]:decoration-brand",
  "tw:[&_strong]:text-fg tw:[&_b]:text-fg",
  "tw:[&_ul]:mb-5 tw:[&_ul]:list-disc tw:[&_ul]:pl-6 tw:[&_ol]:mb-5 tw:[&_ol]:list-decimal tw:[&_ol]:pl-6 tw:[&_li]:mb-2 tw:[&_li]:leading-7 tw:[&_li::marker]:text-brand",
  "tw:[&_blockquote]:my-8 tw:[&_blockquote]:rounded-r-xl tw:[&_blockquote]:border-l-4 tw:[&_blockquote]:border-brand tw:[&_blockquote]:bg-brand-soft tw:[&_blockquote]:px-6 tw:[&_blockquote]:py-4 tw:[&_blockquote]:text-lg tw:[&_blockquote]:italic tw:[&_blockquote]:text-fg tw:[&_blockquote_p]:mb-0",
  "tw:[&_img]:my-6 tw:[&_img]:h-auto tw:[&_img]:max-w-full tw:[&_img]:rounded-xl",
  "tw:[&_figure]:my-8 tw:[&_figure]:mx-0 tw:[&_figure_img]:my-0 tw:[&_figcaption]:mt-2 tw:[&_figcaption]:text-center tw:[&_figcaption]:text-sm tw:[&_figcaption]:text-muted",
  "tw:[&_iframe]:my-6 tw:[&_iframe]:max-w-full tw:[&_iframe]:rounded-xl",
  "tw:[&_table]:my-6 tw:[&_table]:w-full tw:[&_table]:border-collapse tw:[&_td]:border tw:[&_td]:border-line tw:[&_td]:p-2 tw:[&_th]:border tw:[&_th]:border-line tw:[&_th]:bg-surface-2 tw:[&_th]:p-2",
  "tw:[&_hr]:my-10 tw:[&_hr]:border-line",
  "tw:[&>*:first-child]:mt-0 tw:[&>*:last-child]:mb-0",
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
        <article className="tw:mx-auto tw:w-full tw:max-w-3xl tw:px-4 tw:pt-10 tw:pb-12 tw:sm:px-6 tw:lg:pt-14">
          <header className="tw:mb-8">
            {currentNews?.category && (
              <CategoryBadge news={currentNews} className="tw:mb-4" />
            )}
            <h1 className="blog-desc-big tw:m-0 tw:mb-6 tw:font-heading tw:text-3xl tw:font-bold tw:leading-tight tw:tracking-tight tw:text-fg tw:sm:text-4xl tw:lg:text-[2.75rem]">
              {currentNews?.title}
            </h1>

            <div className="tw:flex tw:items-center tw:gap-3">
              {currentNews?.user && (
                <Link
                  href={`/users${currentNews?.user?._id ? `/${currentNews?.user?._id}` : ""}`}
                  className="tw:relative tw:block tw:size-11 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-surface-2 tw:ring-2 tw:ring-line"
                  aria-hidden
                  tabIndex={-1}
                >
                  {currentNews?.user?.photo && (
                    <Image
                      src={currentNews.user.photo}
                      alt=""
                      className="tw:object-cover"
                      sizes="44px"
                      fill
                    />
                  )}
                </Link>
              )}
              <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5 tw:text-sm">
                {currentNews?.user && (
                  <Link
                    href={`/users${currentNews?.user?._id ? `/${currentNews?.user?._id}` : ""}`}
                    className="tw:font-semibold tw:text-fg tw:no-underline tw:hover:text-brand"
                  >
                    {currentNews?.user?.name}
                  </Link>
                )}
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:text-muted">
                  <Moment format="dddd, Do MMMM YYYY HH:mm:ss">
                    {currentNews?.created_at}
                  </Moment>
                  <span aria-hidden className="tw:text-line-strong">
                    &middot;
                  </span>
                  <span className="tw:inline-flex tw:items-center tw:gap-1">
                    <span className="fa fa-clock-o" aria-hidden="true"></span>
                    {currentNews && Math.ceil(currentNews.time_read / 10)} menit
                  </span>
                </div>
              </div>
            </div>
          </header>

          {currentNews?.mainImage && (
            <figure className="tw:relative tw:m-0 tw:mb-10 tw:aspect-video tw:overflow-hidden tw:rounded-2xl tw:bg-surface-2 tw:shadow-card tw:sm:-mx-6 tw:lg:-mx-16">
              <Image
                src={currentNews.mainImage}
                className="tw:object-cover"
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

          <footer className="tw:mt-12 tw:flex tw:flex-col tw:gap-6 tw:border-t tw:border-line tw:pt-8 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <span className="tw:mr-1 tw:text-sm tw:font-semibold tw:text-fg">
                Tag :
              </span>
              {currentNews?.tags &&
                currentNews?.tags.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/newsTags/${tag.slug}`}
                    className={badgeClass(
                      "neutral",
                      "tw:px-3 tw:py-1 tw:transition-colors tw:hover:bg-brand-soft tw:hover:text-brand",
                    )}
                  >
                    #{tag.name}
                  </Link>
                ))}
            </div>
            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
              <span className="tw:mr-1 tw:text-sm tw:font-semibold tw:text-fg">
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
            <section className="tw:mt-10 tw:flex tw:flex-col tw:gap-5 tw:rounded-2xl tw:border tw:border-line tw:bg-surface tw:p-6 tw:shadow-card tw:sm:flex-row tw:sm:items-start">
              <div className="tw:relative tw:size-20 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-surface-2">
                {currentNews?.user?.photo && (
                  <Image
                    src={currentNews.user.photo}
                    alt=""
                    className="tw:object-cover"
                    sizes="80px"
                    fill
                  />
                )}
              </div>
              <div className="tw:min-w-0">
                <h2 className="tw:m-0 tw:mb-2 tw:font-heading tw:text-xl tw:font-bold tw:text-fg">
                  {currentNews?.user?.name}
                </h2>
                {currentNews?.user?.bio && (
                  <p className="tw:m-0 tw:text-[0.95rem] tw:leading-relaxed tw:text-body">
                    {currentNews?.user?.bio}
                  </p>
                )}
                <ul className="tw:m-0 tw:mt-4 tw:flex tw:list-none tw:flex-wrap tw:gap-2 tw:p-0">
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

        <section className="tw:border-t tw:border-line tw:bg-surface-2/50">
          <Container className="tw:py-12 tw:lg:py-16">
            <SectionTitle>Mungkin Anda Tertarik</SectionTitle>
            {relatedNews?.length > 0 ? (
              <div className="tw:grid tw:gap-x-6 tw:gap-y-10 tw:sm:grid-cols-2 tw:lg:grid-cols-4">
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

      <div className="display-ad tw:mx-auto tw:my-2 tw:block tw:text-center"></div>
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
