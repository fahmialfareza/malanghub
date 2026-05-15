import React, { useEffect, useMemo, useState } from "react";
import {
  type AuthResponse,
  type News,
  type NewsListParams,
  type PaginatedResponse,
  type UserProfile,
  useAllDrafts,
  useCategories,
  useCategoryDetail,
  useCurrentUser,
  useMyDrafts,
  useMyNews,
  useNewsDetail,
  useNewsList,
  useNewsSearch,
  useRecentNews,
  useRelatedNews,
  useSignInMutation,
  useSignUpMutation,
  useTags,
  useTagDetail,
  useTrendingNews,
  useUpdateProfileMutation,
  useUserProfile,
} from "@malanghub/core";
import { useAdapters } from "./adapters";
import { useMalanghubRuntime } from "./providers";
import {
  createSlug,
  excerpt,
  formatDate,
  getAuthorHref,
  getCategoryHref,
  getCategoryName,
  getSocialHref,
  readingTime,
  siteUrl,
} from "./utils";

const DEFAULT_AVATAR_SRC = "/assets/images/author.jpg";
const MALANGHUB_ADDRESS =
  "Perum. Bumi Madinah Blok C3, Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151";
const MALANGHUB_MAPS_PLACE_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    MALANGHUB_ADDRESS,
  )}`;
const MALANGHUB_MAPS_NAVIGATION_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    MALANGHUB_ADDRESS,
  )}`;

const Spinner = () => (
  <div className="malanghub-loading" aria-live="polite">
    Loading...
  </div>
);

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <h1 className="malanghub-empty">{children}</h1>
);

const getNewsTags = (news: News) =>
  (news.tags ?? []).filter(
    (tag): tag is Exclude<(typeof news.tags)[number], string> =>
      typeof tag !== "string",
  );

const formatDateTime = (value?: string | Date) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
};

const Breadcrumbs = ({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) => {
  const { Link } = useAdapters();

  return (
    <nav id="breadcrumbs" className="breadcrumbs">
      <div className="container page-wrapper">
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && " / "}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className="breadcrumb_last" aria-current="page">
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

const NewsImage = ({ news }: { news: News }) => {
  const { Image } = useAdapters();
  return (
    <Image
      className="card-img-bottom d-block radius-image embed-responsive-item"
      objectFit="cover"
      src={news.mainImage || "/malanghub-meta.png"}
      alt={news.title}
      fill
    />
  );
};

const NewsMeta = ({ news }: { news: News }) => {
  const { Link } = useAdapters();

  return (
    <>
      <div className="author align-items-center mt-3 mb-1">
        <Link href={getAuthorHref(news)}>{news.user?.name ?? "Penulis"}</Link>{" "}
        di <Link href={getCategoryHref(news)}>{getCategoryName(news)}</Link>
      </div>
      <ul className="blog-meta">
        <li className="meta-item blog-lesson">
          <span className="meta-value">{formatDate(news.created_at)}</span>
        </li>
        <li className="meta-item blog-students">
          <span className="meta-value">{readingTime(news)}</span>
        </li>
      </ul>
    </>
  );
};

const NewsCard = ({ news }: { news: News }) => {
  const { Link } = useAdapters();

  return (
    <div className="card">
      <div className="card-header p-0 position-relative embed-responsive embed-responsive-1by1">
        <Link href={`/news/${news.slug}`}>
          <NewsImage news={news} />
        </Link>
      </div>
      <div className="card-body p-0 blog-details">
        <Link href={`/news/${news.slug}`} className="blog-desc">
          {news.title}
        </Link>
        <div className="text-truncate">{excerpt(news.content, 120)}</div>
        <NewsMeta news={news} />
      </div>
    </div>
  );
};

function buildPageList(
  page: number,
  pageCount: number,
  marginPages = 2,
  pageRange = 5,
): (number | "...")[] {
  const pages = new Set<number>();
  for (let i = 1; i <= Math.min(marginPages, pageCount); i++) pages.add(i);
  for (let i = Math.max(pageCount - marginPages + 1, 1); i <= pageCount; i++)
    pages.add(i);
  const rangeStart = Math.max(
    1,
    Math.min(pageCount - pageRange + 1, page - Math.floor(pageRange / 2)),
  );
  const rangeEnd = Math.min(pageCount, rangeStart + pageRange - 1);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.add(i);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

const NewsGrid = ({
  response,
  onPageChange,
}: {
  response?: PaginatedResponse<News>;
  onPageChange?: (page: number) => void;
}) => {
  const news = response?.data ?? [];
  const meta = response?.meta ?? response?.pagination;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? 1;
  const total = meta?.total ?? news.length;
  const pageCount = Math.max(Math.ceil(total / limit), 1);

  if (!news.length) return <EmptyState>Belum Ada Berita</EmptyState>;

  return (
    <div className="row">
      {news.map((item, index) => (
        <div
          key={item._id}
          className={
            index === 0
              ? "col-md-12 item"
              : "col-lg-6 col-md-6 item mt-5 pt-lg-3"
          }
        >
          <NewsCard news={item} />
        </div>
      ))}
      {onPageChange && pageCount > 1 && (
        <div className="pagination-wrapper mt-5">
          <ul className="page-pagination">
            <li>
              <a
                href={`#page-${Math.max(page - 1, 1)}`}
                className="page-numbers"
                aria-disabled={page <= 1}
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
              >
                {"<"}
              </a>
            </li>
            {buildPageList(page, pageCount).map((item, index) =>
              item === "..." ? (
                <li key={`ellipsis-${index}`}>
                  <span className="page-numbers page-numbers-break">
                    {"..."}
                  </span>
                </li>
              ) : (
                <li key={item}>
                  <a
                    href={`#page-${item}`}
                    className={`page-numbers${page === item ? " active" : ""}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onPageChange(item);
                    }}
                  >
                    {item}
                  </a>
                </li>
              ),
            )}
            <li>
              <a
                href={`#page-${Math.min(page + 1, pageCount)}`}
                className="page-numbers"
                aria-disabled={page >= pageCount}
                onClick={(event) => {
                  event.preventDefault();
                  if (page < pageCount) onPageChange(page + 1);
                }}
              >
                {">"}
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const HomeNews = ({ news }: { news: News[] }) => {
  const { Link } = useAdapters();

  if (!news.length) return <EmptyState>Belum Ada Berita</EmptyState>;

  const [featured, ...rest] = news;

  return (
    <div className="row">
      <div className="col-lg-5 col-md-6 item">
        <NewsCard news={featured} />
        <Link href="/news" className="btn btn-style btn-outline mt-4">
          Semua Berita
        </Link>
      </div>
      <div className="col-lg-7 col-md-6 mt-md-0 mt-5">
        <div className="list-view list-view1">
          {rest.map((item, index) => (
            <div
              key={item._id}
              className={`grids5-info ${index > 0 ? "mt-5" : ""}`}
            >
              <Link
                href={`/news/${item.slug}`}
                className="d-block zoom embed-responsive embed-responsive-1by1"
              >
                <NewsImage news={item} />
              </Link>
              <div className="blog-info align-self">
                <Link href={`/news/${item.slug}`} className="blog-desc1">
                  {item.title}
                </Link>
                <NewsMeta news={item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TrendingList = ({ news }: { news: News[] }) => {
  const { Link } = useAdapters();

  if (!news.length) return <EmptyState>Belum Ada Berita</EmptyState>;

  return (
    <>
      {news.map((item, index) => (
        <div key={item._id} className="grids5-info">
          <h4>{index + 1}.</h4>
          <div className="blog-info">
            <Link href={`/news/${item.slug}`} className="blog-desc1">
              {item.title}
            </Link>
            <NewsMeta news={item} />
          </div>
        </div>
      ))}
    </>
  );
};

const TwoColumnNewsLayout = ({
  title,
  children,
  trending,
}: {
  title: string;
  children: React.ReactNode;
  trending?: News[];
}) => (
  <div className="w3l-searchblock w3l-homeblock1 py-5">
    <div className="container py-lg-4 py-md-3">
      <div className="row">
        <div className="col-lg-8 most-recent">
          <h3 className="section-title-left">{title}</h3>
          {children}
        </div>
        <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
          <div className="pos-sticky">
            <h3 className="section-title-left">Trending</h3>
            <TrendingList news={trending ?? []} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const HomePage = () => {
  const { api } = useMalanghubRuntime();
  const { Meta } = useAdapters();
  const recent = useRecentNews(api, 4);
  const trending = useTrendingNews(api, 4);

  return (
    <>
      <Meta
        title="Malanghub - Beranda"
        description="Malanghub - Beranda - Situs yang menyediakan informasi sekitar Malang Raya!"
        canonical={`${siteUrl}/`}
        image={`${siteUrl}/malanghub-meta.png`}
      />
      <div className="w3l-homeblock1 py-5">
        <div className="container pt-lg-5 pt-md-4">
          <div className="row">
            <div className="col-lg-9">
              <h3 className="section-title-left">Berita Terbaru</h3>
              {recent.isLoading ? (
                <Spinner />
              ) : (
                <HomeNews news={recent.data?.data ?? []} />
              )}
            </div>
            <div className="col-lg-3 trending mt-lg-0 mt-5">
              <h3 className="section-title-left">Trending</h3>
              {trending.isLoading ? (
                <Spinner />
              ) : (
                <TrendingList news={trending.data?.data ?? []} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const NewsListPage = () => {
  const { api } = useMalanghubRuntime();
  const { Meta } = useAdapters();
  const [page, setPage] = useState(1);
  const news = useNewsList(api, { page, sort: "-created_at", limit: 5 });
  const trending = useTrendingNews(api, 4);

  return (
    <>
      <Meta
        title="Malanghub - Semua Berita"
        description="Malanghub - Semua Berita - Situs yang menyediakan informasi sekitar Malang Raya!"
        canonical={`${siteUrl}/news`}
      />
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Semua Berita" }]}
      />
      <TwoColumnNewsLayout title="Semua Berita" trending={trending.data?.data}>
        {news.isLoading ? (
          <Spinner />
        ) : (
          <NewsGrid response={news.data} onPageChange={setPage} />
        )}
      </TwoColumnNewsLayout>
    </>
  );
};

const TaxonomyPage = ({
  type,
  slug,
}: {
  type: "category" | "tag";
  slug?: string;
}) => {
  const { api } = useMalanghubRuntime();
  const { Meta } = useAdapters();
  const [page, setPage] = useState(1);
  const category = useCategoryDetail(
    api,
    type === "category" ? slug : undefined,
  );
  const tag = useTagDetail(api, type === "tag" ? slug : undefined);
  const entity = type === "category" ? category.data?.category : tag.data?.tag;
  const params: NewsListParams =
    type === "category"
      ? { page, category: entity?.id ?? entity?._id, limit: 5 }
      : { page, tags: entity?.id ?? entity?._id, limit: 5 };
  const news = useNewsList(api, params);
  const trending = useTrendingNews(api, 4);
  const titlePrefix = type === "category" ? "Kategori Berita" : "Tag Berita";
  const routePrefix = type === "category" ? "newsCategories" : "newsTags";
  const isLoading = category.isLoading || tag.isLoading || news.isLoading;

  return (
    <>
      <Meta
        title={`Malanghub - ${titlePrefix} - ${entity?.name ?? ""}`}
        description={`Malanghub - ${titlePrefix} - ${entity?.name ?? ""}`}
        canonical={`${siteUrl}/${routePrefix}/${entity?.slug ?? slug ?? ""}`}
      />
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: titlePrefix, href: "/news" },
          { label: entity?.name ?? slug ?? "" },
        ]}
      />
      <TwoColumnNewsLayout
        title={entity?.name ?? titlePrefix}
        trending={trending.data?.data}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <NewsGrid response={news.data} onPageChange={setPage} />
        )}
      </TwoColumnNewsLayout>
    </>
  );
};

export const NewsCategoryPage = ({ slug }: { slug?: string }) => (
  <TaxonomyPage type="category" slug={slug} />
);

export const NewsTagPage = ({ slug }: { slug?: string }) => (
  <TaxonomyPage type="tag" slug={slug} />
);

export const SearchPage = ({ search }: { search?: string }) => {
  const { api } = useMalanghubRuntime();
  const { Meta } = useAdapters();
  const [page, setPage] = useState(1);
  const news = useNewsSearch(api, search, page);
  const trending = useTrendingNews(api, 4);

  return (
    <>
      <Meta
        title={`Malanghub - Pencarian - ${search ?? ""}`}
        description={`Hasil pencarian Malanghub untuk ${search ?? ""}`}
      />
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: `Pencarian: ${search ?? ""}` },
        ]}
      />
      <TwoColumnNewsLayout
        title={`Pencarian: ${search ?? ""}`}
        trending={trending.data?.data}
      >
        {news.isLoading ? (
          <Spinner />
        ) : (
          <NewsGrid response={news.data} onPageChange={setPage} />
        )}
      </TwoColumnNewsLayout>
    </>
  );
};

export const NewsDetailPage = ({ slug }: { slug?: string }) => {
  const { api } = useMalanghubRuntime();
  const { Link, Image, Meta } = useAdapters();
  const news = useNewsDetail(api, slug);
  const related = useRelatedNews(api, news.data);

  if (news.isLoading) return <Spinner />;
  if (!news.data) return <EmptyState>Berita tidak ditemukan</EmptyState>;

  const currentNews = news.data;
  const newsTags = getNewsTags(currentNews);

  return (
    <>
      <Meta
        title={`Malanghub - Berita - ${currentNews.title}`}
        description={excerpt(currentNews.content)}
        canonical={`${siteUrl}/news/${currentNews.slug}`}
        image={currentNews.mainImage}
      />
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: "/news" },
          { label: currentNews.title },
        ]}
      />
      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <div className="pb-5 w3l-homeblock1 text-center">
                <div className="container mt-md-3">
                  <h3 className="blog-desc-big text-center mb-4">
                    {currentNews.title}
                  </h3>
                  <div className="blog-post-align">
                    <div className="blog-post-img embed-responsive embed-responsive-1by1">
                      <Link href={getAuthorHref(currentNews)}>
                        <Image
                          src={currentNews.user?.photo || DEFAULT_AVATAR_SRC}
                          className="rounded-circle img-fluid embed-responsive-item"
                          alt={currentNews.user?.name ?? "Penulis"}
                          objectFit="cover"
                          fill
                        />
                      </Link>
                    </div>
                    <div className="blog-post-info">
                      <div className="author align-items-center mb-1">
                        <Link href={getAuthorHref(currentNews)}>
                          {currentNews.user?.name ?? "Penulis"}
                        </Link>{" "}
                        di{" "}
                        <Link href={getCategoryHref(currentNews)}>
                          {getCategoryName(currentNews)}
                        </Link>
                      </div>
                      <ul className="blog-meta">
                        <li className="meta-item blog-lesson">
                          <span className="meta-value">
                            {formatDateTime(currentNews.created_at)}
                          </span>
                        </li>
                        <li className="meta-item blog-students">
                          <span className="meta-value">
                            {readingTime(currentNews)}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <section className="blog-post-main w3l-homeblock1">
                <div className="blog-content-inf pb-5">
                  <div className="container pb-lg-4">
                    <div className="single-post-image">
                      <div className="post-content embed-responsive embed-responsive-4by3">
                        <Image
                          src={currentNews.mainImage || "/malanghub-meta.png"}
                          alt={currentNews.title}
                          className="radius-image img-fluid pb-5 embed-responsive-item"
                          objectFit="cover"
                          fill
                        />
                      </div>
                    </div>

                    <div className="single-post-content text-justify">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: currentNews.content,
                        }}
                      />

                      <div className="d-grid left-right mt-5 pb-md-5">
                        <div className="buttons-singles tags">
                          <h4>Tag :</h4>
                          {newsTags.map((tag) => (
                            <Link
                              key={tag._id ?? tag.slug}
                              href={`/newsTags/${tag.slug}`}
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                        <div className="buttons-singles">
                          <h4>Bagikan :</h4>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.facebook.com/share.php?u=${siteUrl}/news/${currentNews.slug}`}
                          >
                            <span
                              className="fa fa-facebook"
                              aria-hidden="true"
                            />
                          </a>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://twitter.com/intent/tweet?text=${siteUrl}/news/${currentNews.slug}`}
                          >
                            <span
                              className="fa fa-twitter"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      </div>

                      <div className="author-card mt-5">
                        <div className="row align-items-center">
                          <div className="col-sm-3 col-6">
                            <div className="embed-responsive embed-responsive-1by1">
                              <Image
                                src={
                                  currentNews.user?.photo || DEFAULT_AVATAR_SRC
                                }
                                alt={currentNews.user?.name ?? "Penulis"}
                                className="rounded-circle img-fluid embed-responsive-item"
                                objectFit="cover"
                                fill
                              />
                            </div>
                          </div>
                          <div className="col-sm-9 mt-sm-0 mt-3">
                            <h3 className="mb-3 title">
                              {currentNews.user?.name ?? "Penulis"}
                            </h3>
                            {currentNews.user?.bio && (
                              <p>{currentNews.user.bio}</p>
                            )}
                            <ul className="author-icons mt-4">
                              {currentNews.user?.facebook && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="facebook"
                                    href={getSocialHref(
                                      "facebook",
                                      currentNews.user.facebook,
                                    )}
                                  >
                                    <span
                                      className="fab fa-facebook"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              )}
                              {currentNews.user?.twitter && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="twitter"
                                    href={getSocialHref(
                                      "twitter",
                                      currentNews.user.twitter,
                                    )}
                                  >
                                    <span
                                      className="fab fa-twitter"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              )}
                              {currentNews.user?.instagram && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="instagram"
                                    href={getSocialHref(
                                      "instagram",
                                      currentNews.user.instagram,
                                    )}
                                  >
                                    <span
                                      className="fab fa-instagram"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              )}
                              {currentNews.user?.linkedin && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="linkedin"
                                    href={getSocialHref(
                                      "linkedin",
                                      currentNews.user.linkedin,
                                    )}
                                  >
                                    <span
                                      className="fab fa-linkedin"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              )}
                              {currentNews.user?.tiktok && (
                                <li>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    className="tiktok"
                                    href={getSocialHref(
                                      "tiktok",
                                      currentNews.user.tiktok,
                                    )}
                                  >
                                    <span
                                      className="fab fa-tiktok"
                                      aria-hidden="true"
                                    />
                                  </a>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
              <div className="pos-sticky">
                <h3 className="section-title-left">Mungkin Anda Tertarik </h3>
                {related.isLoading ? (
                  <Spinner />
                ) : (
                  <TrendingList news={related.data?.data ?? []} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AuthCard = ({ children }: { children: React.ReactNode }) => (
  <section className="w3l-contact-2 py-5">
    <div className="container py-lg-5 py-md-4">{children}</div>
  </section>
);

const GoogleAuthButton = ({
  label,
  onSuccess,
}: {
  label: "Masuk" | "Daftar";
  onSuccess(data: AuthResponse): void | Promise<void>;
}) => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const [loading, setLoading] = useState(false);
  if (adapters.googleAuthHidden) return null;

  const available =
    Boolean(adapters.googleAuthAvailable) &&
    Boolean(adapters.requestGoogleAuth || adapters.requestGoogleAccessToken);

  const getGoogleErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    return "Google login gagal";
  };

  const onGoogleAuth = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!available) {
      notify("Google login belum dikonfigurasi.", "danger");
      return;
    }

    setLoading(true);
    try {
      const auth = adapters.requestGoogleAuth
        ? await adapters.requestGoogleAuth()
        : await (async () => {
            const accessToken = await adapters.requestGoogleAccessToken?.();
            if (!accessToken) {
              throw new Error("Google tidak mengembalikan access token.");
            }

            return api.auth.google({ access_token: accessToken });
          })();

      await onSuccess(auth);
    } catch (error) {
      adapters.reportError?.(error);
      notify(getGoogleErrorMessage(error), "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <a
        href="#google"
        onClick={onGoogleAuth}
        className={`btn btn-danger btn-block btn-lg text-light ${
          !available ? "disabled" : ""
        }`}
        aria-disabled={!available || loading}
      >
        <i className="fa fa-google" />{" "}
        {loading ? "Memproses..." : `${label} dengan`} <b>Google</b>
      </a>
      {!available && (
        <div className="malanghub-native-note mt-3">
          {adapters.googleAuthUnavailableMessage ??
            "Isi Google client ID untuk mengaktifkan Google login."}
        </div>
      )}
    </>
  );
};

export const SignInPage = () => {
  const { api, authStorage, refreshAuth, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const { Link } = adapters;
  const [form, setForm] = useState({ email: "", password: "" });
  const onAuthSuccess = async (data: AuthResponse) => {
    await authStorage.setToken(data.token);
    refreshAuth();
    notify("Berhasil masuk", "success");
    adapters.navigate("/users");
  };
  const signIn = useSignInMutation(api, onAuthSuccess);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      notify("Please fill in all fields", "danger");
      return;
    }
    signIn.mutate(form, {
      onError: (error) => {
        adapters.reportError?.(error);
        notify(
          error instanceof Error ? error.message : "Gagal masuk",
          "danger",
        );
      },
    });
  };

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Masuk" }]}
      />
      <AuthCard>
        <h3 className="section-title-left">Masuk</h3>
        <div className="contact-grids d-grid">
          <div className="contact-left m-auto">
            {adapters.googleAuthHidden ? (
              <img
                src="/logo.png"
                alt={adapters.appName ?? "Malanghub"}
                className="malanghub-auth-logo"
              />
            ) : (
              <GoogleAuthButton label="Masuk" onSuccess={onAuthSuccess} />
            )}
          </div>
          <div className="contact-right">
            <form onSubmit={submit} className="signin-form">
              <div className="input-grids">
                <input
                  type="email"
                  name="email"
                  placeholder="Email*"
                  className="contact-input"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password*"
                  className="contact-input"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  required
                />
              </div>
              <button
                className="btn btn-style btn-outline"
                type="submit"
                disabled={signIn.isPending}
              >
                Masuk
              </button>
              <p className="malanghub-auth-switch mt-4">
                Belum punya akun? <Link href="/signup">Daftar sekarang</Link>
              </p>
            </form>
          </div>
        </div>
      </AuthCard>
    </>
  );
};

export const SignUpPage = () => {
  const { api, authStorage, refreshAuth, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const { Link } = adapters;
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const onAuthSuccess = async (data: AuthResponse) => {
    await authStorage.setToken(data.token);
    refreshAuth();
    notify("Akun berhasil dibuat", "success");
    adapters.navigate("/users");
  };
  const signUp = useSignUpMutation(api, onAuthSuccess);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password) {
      notify("Please fill in all fields", "danger");
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      notify("Password does not match", "danger");
      return;
    }
    signUp.mutate(form, {
      onError: (error) => {
        adapters.reportError?.(error);
        notify(
          error instanceof Error ? error.message : "Gagal daftar",
          "danger",
        );
      },
    });
  };

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Daftar" }]}
      />
      <AuthCard>
        <h3 className="section-title-left">Daftar</h3>
        <div className="contact-grids d-grid">
          <div className="contact-left m-auto">
            {adapters.googleAuthHidden ? (
              <img
                src="/logo.png"
                alt={adapters.appName ?? "Malanghub"}
                className="malanghub-auth-logo"
              />
            ) : (
              <GoogleAuthButton label="Daftar" onSuccess={onAuthSuccess} />
            )}
          </div>
          <div className="contact-right">
            <form onSubmit={submit} className="signin-form">
              <div className="input-grids">
                <input
                  type="text"
                  name="name"
                  placeholder="Nama*"
                  className="contact-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email*"
                  className="contact-input"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password*"
                  className="contact-input"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  name="passwordConfirmation"
                  placeholder="Konfirmasi Password*"
                  className="contact-input"
                  value={form.passwordConfirmation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      passwordConfirmation: event.target.value,
                    })
                  }
                  required
                />
              </div>
              <button
                className="btn btn-style btn-outline"
                type="submit"
                disabled={signUp.isPending}
              >
                Daftar
              </button>
              <p className="malanghub-auth-switch mt-4">
                Sudah punya akun? <Link href="/signin">Masuk</Link>
              </p>
            </form>
          </div>
        </div>
      </AuthCard>
    </>
  );
};

const AuthorSocialLinks = ({ user }: { user: UserProfile }) => (
  <ul className="author-icons mt-4">
    {user.facebook && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="facebook"
          href={getSocialHref("facebook", user.facebook)}
        >
          <span className="fab fa-facebook" aria-hidden="true" />
        </a>
      </li>
    )}
    {user.twitter && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="twitter"
          href={getSocialHref("twitter", user.twitter)}
        >
          <span className="fab fa-twitter" aria-hidden="true" />
        </a>
      </li>
    )}
    {user.instagram && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="instagram"
          href={getSocialHref("instagram", user.instagram)}
        >
          <span className="fab fa-instagram" aria-hidden="true" />
        </a>
      </li>
    )}
    {user.linkedin && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="linkedin"
          href={getSocialHref("linkedin", user.linkedin)}
        >
          <span className="fab fa-linkedin" aria-hidden="true" />
        </a>
      </li>
    )}
    {user.tiktok && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="tiktok"
          href={getSocialHref("tiktok", user.tiktok)}
        >
          <span className="fab fa-tiktok" aria-hidden="true" />
        </a>
      </li>
    )}
  </ul>
);

type DashboardTab = "berita" | "antrian" | "persetujuan";

const LegacyDashboardPage = () => {
  const { api, authStorage, authVersion, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const [hasToken, setHasToken] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<DashboardTab>("berita");
  const [profile, setProfile] = useState({ name: "", motto: "", bio: "" });
  const currentUser = useCurrentUser(api, hasToken);
  const myNews = useMyNews(api, hasToken);
  const myDrafts = useMyDrafts(api, hasToken);
  const isAdmin = Boolean(currentUser.data?.role?.includes("admin"));
  const allDrafts = useAllDrafts(api, hasToken && isAdmin);
  const updateProfile = useUpdateProfileMutation(api);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
      if (!token) adapters.navigate("/signin");
    });
  }, [adapters, authStorage, authVersion]);

  useEffect(() => {
    if (!currentUser.data) return;
    setProfile({
      name: currentUser.data.name ?? "",
      motto: currentUser.data.motto ?? "",
      bio: currentUser.data.bio ?? "",
    });
  }, [currentUser.data]);

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(profile, {
      onSuccess: () => {
        notify("Profil diperbarui", "success");
        setEditOpen(false);
      },
      onError: (error) =>
        notify(
          error instanceof Error ? error.message : "Gagal memperbarui profil",
          "danger",
        ),
    });
  };

  if (currentUser.isLoading) return <Spinner />;

  if (currentUser.isError) {
    return (
      <EmptyState>
        Gagal memuat profil.{" "}
        <button
          className="btn btn-style btn-outline mt-2"
          onClick={() => void currentUser.refetch()}
        >
          Coba Lagi
        </button>
      </EmptyState>
    );
  }

  const user = currentUser.data;

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Profil" }]}
      />
      <section id="author" className="w3l-author py-5">
        <div className="container py-md-3">
          <div className="row align-items-center">
            <div className="col-md-3 col-sm-4 col-7 order-first">
              <div className="embed-responsive embed-responsive-1by1">
                <adapters.Image
                  src={user?.photo || DEFAULT_AVATAR_SRC}
                  alt={user?.name ?? "Profil"}
                  className="rounded-circle img-fluid embed-responsive-item"
                  objectFit="cover"
                  fill
                />
              </div>
            </div>
            <div className="col-md-9 col-sm-12 order-md-first mt-lg-0 mt-4">
              {user?.motto && <span className="category">{user.motto}</span>}
              <h1 className="mb-4 title">
                Halo, <span className="typed-text">{user?.name}</span>
                <span className="cursor typing">&nbsp;</span>
              </h1>
              {user?.bio && (
                <p dangerouslySetInnerHTML={{ __html: user.bio }} />
              )}
              {user && <AuthorSocialLinks user={user} />}
              <button
                className="btn btn-primary btn-block my-2"
                onClick={() => setEditOpen((v) => !v)}
              >
                <i className="fa fa-edit" aria-hidden="true" /> Edit Profil
              </button>
            </div>
          </div>
          {editOpen && (
            <form
              className="malanghub-profile-form mt-4"
              onSubmit={saveProfile}
            >
              <input
                value={profile.name}
                placeholder="Nama"
                onChange={(event) =>
                  setProfile({ ...profile, name: event.target.value })
                }
              />
              <input
                value={profile.motto}
                placeholder="Motto"
                onChange={(event) =>
                  setProfile({ ...profile, motto: event.target.value })
                }
              />
              <textarea
                value={profile.bio}
                placeholder="Bio"
                onChange={(event) =>
                  setProfile({ ...profile, bio: event.target.value })
                }
              />
              <div className="malanghub-profile-form-actions">
                <button
                  className="btn btn-style btn-primary"
                  type="submit"
                  disabled={updateProfile.isPending}
                >
                  Simpan Profil
                </button>
                <button
                  className="btn btn-style btn-outline"
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <header id="main-header" className="py-2">
        <div className="container">
          <h1>
            <i className="fa fa-cog" aria-hidden="true" /> Dashboard
          </h1>
        </div>
      </header>

      <section className="w3l-homeblock1 py-4 mb-5">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-3 mb-2">
              <button
                className={`btn btn-block ${tab === "berita" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("berita")}
              >
                Berita
              </button>
            </div>
            <div className="col-md-3 mb-2">
              <button
                className={`btn btn-block ${tab === "antrian" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("antrian")}
              >
                Antrian Berita
              </button>
            </div>
            {isAdmin && (
              <div className="col-md-3 mb-2">
                <button
                  className={`btn btn-block ${tab === "persetujuan" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setTab("persetujuan")}
                >
                  Persetujuan Berita
                </button>
              </div>
            )}
            <div className="col-md-3 mb-2">
              <adapters.Link
                href="/users/newsDrafts/new"
                className="btn btn-success btn-block"
              >
                <i className="fa fa-plus" aria-hidden="true" /> Tulis Draft
              </adapters.Link>
            </div>
          </div>

          <div className="row">
            <div className="col-md-9 mb-4">
              <div className="card malanghub-dashboard-card">
                <div className="card-header">
                  <h4>
                    {tab === "berita"
                      ? "Berita Saya"
                      : tab === "antrian"
                        ? "Antrian Berita"
                        : "Persetujuan Berita"}
                  </h4>
                </div>
                <div className="table-responsive">
                  <table className="table malanghub-dashboard-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Judul</th>
                        {tab !== "berita" && <th>Status</th>}
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows =
                          tab === "berita"
                            ? (myNews.data ?? [])
                            : tab === "antrian"
                              ? (myDrafts.data ?? [])
                              : (allDrafts.data ?? []);
                        if (!rows.length) {
                          return (
                            <tr>
                              <td colSpan={tab !== "berita" ? 5 : 4}>
                                Belum ada data.
                              </td>
                            </tr>
                          );
                        }
                        return rows.map((item, index) => (
                          <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td>
                              <adapters.Link href={`/news/${item.slug}`}>
                                {item.title}
                              </adapters.Link>
                            </td>
                            {tab !== "berita" && (
                              <td>{item.approved ? "Terbit" : "Pending"}</td>
                            )}
                            <td>{formatDate(item.created_at)}</td>
                            <td>{formatDate(item.updated_at)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-center bg-primary text-light mb-3">
                <div className="card-body">
                  <h3 style={{ color: "#f8f9fa" }}>Berita</h3>
                  <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                    <i className="fa fa-pencil-alt" aria-hidden="true" />{" "}
                    {myNews.data?.length ?? 0}
                  </h4>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setTab("berita")}
                  >
                    Lihat
                  </button>
                </div>
              </div>
              <div className="card text-center bg-primary text-light mb-3">
                <div className="card-body">
                  <h3 style={{ color: "#f8f9fa" }}>Antrian</h3>
                  <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                    <i className="fa fa-pencil-alt" aria-hidden="true" />{" "}
                    {myDrafts.data?.length ?? 0}
                  </h4>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setTab("antrian")}
                  >
                    Lihat
                  </button>
                </div>
              </div>
              {isAdmin && (
                <div className="card text-center bg-primary text-light mb-3">
                  <div className="card-body">
                    <h3 style={{ color: "#f8f9fa" }}>Persetujuan</h3>
                    <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                      <i className="fa fa-pencil-alt" aria-hidden="true" />{" "}
                      {allDrafts.data?.length ?? 0}
                    </h4>
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={() => setTab("persetujuan")}
                    >
                      Lihat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const UserProfilePage = ({ id }: { id?: string }) => {
  const { api } = useMalanghubRuntime();
  const adapters = useAdapters();
  const [page, setPage] = useState(1);
  const userQuery = useUserProfile(api, id);
  const profileNews = useNewsList(api, { page, user: id, limit: 5 });
  const threeMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString();
  }, []);
  const trendingByUser = useNewsList(api, {
    page: 1,
    limit: 4,
    sort: "-views",
    user: id,
    createdAfter: threeMonthsAgo,
  });

  const user = userQuery.data;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Pengguna" },
          { label: user?.name ?? id ?? "" },
        ]}
      />
      <section id="author" className="w3l-author py-5">
        <div className="container py-md-3">
          {userQuery.isLoading ? (
            <Spinner />
          ) : userQuery.isError ? (
            <EmptyState>
              Pengguna tidak ditemukan.{" "}
              <button
                className="btn btn-style btn-outline mt-2"
                onClick={() => void userQuery.refetch()}
              >
                Coba Lagi
              </button>
            </EmptyState>
          ) : (
            <div className="row align-items-center">
              <div className="col-md-3 col-sm-4 col-7 order-first">
                <div className="embed-responsive embed-responsive-1by1">
                  <adapters.Image
                    src={user?.photo || DEFAULT_AVATAR_SRC}
                    alt={user?.name ?? "Pengguna"}
                    className="rounded-circle img-fluid embed-responsive-item"
                    objectFit="cover"
                    fill
                  />
                </div>
              </div>
              <div className="col-md-9 col-sm-12 order-md-first mt-lg-0 mt-4">
                {user?.motto && <span className="category">{user.motto}</span>}
                <h1 className="mb-4 title">
                  <span className="typed-text">{user?.name}</span>
                  <span className="cursor typing">&nbsp;</span>
                </h1>
                {user?.bio && (
                  <p dangerouslySetInnerHTML={{ __html: user.bio }} />
                )}
                {user && <AuthorSocialLinks user={user} />}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="w3l-authorblock2 w3l-homeblock1 mb-5 pb-5">
        <div className="container">
          <div className="item mt-4">
            <div className="row mt-5 pt-md-5 img-block-mobile">
              <div className="col-lg-9 most-recent">
                <h3 className="section-title-left">
                  Berita dari {user?.name ?? "Pengguna"}
                </h3>
                {profileNews.isLoading ? (
                  <Spinner />
                ) : (
                  <NewsGrid
                    response={profileNews.data}
                    onPageChange={setPage}
                  />
                )}
              </div>
              <div className="col-lg-3 trending mb-5 mt-lg-0 mt-5">
                <div className="pos-sticky">
                  <h3 className="section-title-left">
                    Trending oleh {user?.name ?? "Pengguna"}
                  </h3>
                  {trendingByUser.isLoading ? (
                    <Spinner />
                  ) : (
                    <TrendingList news={trendingByUser.data?.data ?? []} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const StaticPage = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <>
    <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: title }]} />
    <section className="w3l-contact-2 py-5">
      <div className="container py-lg-5 py-md-4">
        <h3 className="section-title-left">{title}</h3>
        <div className="malanghub-static-content">{children}</div>
      </div>
    </section>
  </>
);

export interface DownloadLink {
  platform: string;
  group: "mobile" | "desktop";
  href?: string;
  icon: string;
  description: string;
  status?: string;
}

const DownloadCard = ({ item }: { item: DownloadLink }) => {
  const isExternal = Boolean(item.href && /^(https?:)?\/\//.test(item.href));

  return (
    <article
      className={`malanghub-download-card${item.href ? "" : " is-disabled"}`}
    >
      <div className="malanghub-download-card-icon">
        <span className={`fa ${item.icon}`} aria-hidden="true" />
      </div>
      <div className="malanghub-download-card-body">
        <h4>{item.platform}</h4>
        <p>{item.description}</p>
        {item.href ? (
          <a
            className="btn btn-primary"
            href={item.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            <span className="fa fa-download mr-2" aria-hidden="true" />
            Unduh
          </a>
        ) : (
          <span className="malanghub-download-status">
            {item.status ?? "Segera hadir"}
          </span>
        )}
      </div>
    </article>
  );
};

export const DownloadPage = ({ links }: { links: DownloadLink[] }) => {
  const { Meta, Link } = useAdapters();
  const mobileLinks = links.filter((link) => link.group === "mobile");
  const desktopLinks = links.filter((link) => link.group === "desktop");

  return (
    <>
      <Meta
        title="Malanghub - Download"
        description="Download aplikasi Malanghub untuk Android, iOS, macOS, Windows, dan Linux."
        canonical={`${siteUrl}/download`}
        image={`${siteUrl}/malanghub-meta.png`}
      />
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Download" }]}
      />
      <section className="malanghub-download-page py-5">
        <div className="container py-lg-5 py-md-4">
          <div className="row align-items-start">
            <div className="col-lg-4 mb-5 mb-lg-0">
              <div className="malanghub-download-intro">
                <span className="malanghub-download-kicker">Aplikasi Native</span>
                <h3 className="section-title-left">Download Malanghub</h3>
                <p>
                  Baca berita, kelola draft, dan masuk ke akun Malanghub dari
                  aplikasi desktop maupun mobile.
                </p>
                <Link href="/contact" className="malanghub-download-help">
                  Butuh bantuan instalasi?
                </Link>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="malanghub-download-section">
                <h4>Mobile</h4>
                <div className="malanghub-download-grid">
                  {mobileLinks.map((item) => (
                    <DownloadCard key={item.platform} item={item} />
                  ))}
                </div>
              </div>

              <div className="malanghub-download-section mt-5">
                <h4>Desktop</h4>
                <div className="malanghub-download-grid">
                  {desktopLinks.map((item) => (
                    <DownloadCard key={item.platform} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const ContactPage = () => {
  const { Meta } = useAdapters();

  return (
    <>
      <Meta
        title="Malanghub - Kontak"
        description="Malanghub - Kontak - Situs yang menyediakan informasi sekitar Malang Raya!"
        canonical={`${siteUrl}/contact`}
        image={`${siteUrl}/malanghub-meta.png`}
      />
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Kontak" }]}
      />
      <section className="w3l-contact-2 py-5">
        <div className="container py-lg-5 py-md-4">
          <h3 className="section-title-left">Tinggalkan pesan untuk kami </h3>
          <div className="contact-grids d-grid">
            <div className="contact-left">
              <h3 className="mb-3">Kontak Kami</h3>
              <p className="text-justify">
                Semuanya dimulai dengan Halo! Kami di sini menjawab apa pun
                pertanyaan yang mungkin Anda miliki dan memberikan solusi
                efektif untuk Anda tentang layanan Malanghub.
              </p>

              <p className="text-justify">
                Kami memiliki pusat dukungan khusus untuk semua dukungan Anda.
                Kami biasanya akan menghubungi Anda dalam waktu 12-24 jam.
              </p>
              <div className="cont-details">
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-map-marker" />
                  </div>
                  <div className="cont-right">
                    <h6>Alamat</h6>
                    <p>Perum. Bumi Madinah Blok C3</p>
                    <p>
                      Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151
                    </p>
                    <p>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={MALANGHUB_MAPS_NAVIGATION_URL}
                      >
                        Buka Navigasi Google Maps
                      </a>
                    </p>
                  </div>
                </div>
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-phone" />
                  </div>
                  <div className="cont-right">
                    <h6>Whatsapp Kami</h6>
                    <p>
                      <i className="fa fa-whatsapp" />{" "}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://wa.me/62895424785888"
                      >
                        0895424785888
                      </a>
                    </p>
                  </div>
                </div>
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-envelope-o" />
                  </div>
                  <div className="cont-right">
                    <h6>Email Kami</h6>
                    <p>
                      <a href="mailto:admin@malanghub.com" className="mail">
                        admin@malanghub.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-right">
              <div className="malanghub-map-embed">
                <div className="embed-responsive embed-responsive-1by1">
                  <iframe
                    title="Lokasi Malanghub"
                    className="embed-responsive-item"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.6257545166436!2d112.56973751477908!3d-7.934097594284932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7883c600d082fd%3A0x3f1caf9c821540c1!2sPerum.%20Bumi%20Madinah%20Blok%20C%202!5e0!3m2!1sen!2sid!4v1614682193710!5m2!1sen!2sid"
                    style={{ border: 0, borderRadius: 10 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <a
                  className="malanghub-map-hitarea malanghub-map-hitarea-link"
                  target="_blank"
                  rel="noreferrer"
                  href={MALANGHUB_MAPS_PLACE_URL}
                  aria-label="Buka lokasi di Google Maps"
                >
                  Buka lokasi di Google Maps
                </a>
                <a
                  className="malanghub-map-hitarea malanghub-map-hitarea-navigation"
                  target="_blank"
                  rel="noreferrer"
                  href={MALANGHUB_MAPS_NAVIGATION_URL}
                  aria-label="Buka navigasi Google Maps"
                >
                  Buka navigasi Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const termsSections = [
  "Penerimaan Syarat",
  "Tentang Malanghub",
  "Penggunaan Konten",
  "Akun Pengguna",
  "Konten yang Dikirimkan Pengguna",
  "Penafian",
  "Batasan Tanggung Jawab",
  "Tautan ke Situs Pihak Ketiga",
  "Perubahan Syarat dan Ketentuan",
  "Hukum yang Berlaku",
  "Hubungi Kami",
];

const privacySections = [
  "Pendahuluan",
  "Data yang Kami Kumpulkan",
  "Cara Kami Menggunakan Data",
  "Layanan Pihak Ketiga",
  "Cookie",
  "Keamanan Data",
  "Hak Pengguna",
  "Data Anak-Anak",
  "Perubahan Kebijakan Privasi",
  "Hubungi Kami",
];

const LegalPageShell = ({
  title,
  description,
  sections,
  children,
  sidebar,
}: {
  title: string;
  description: string;
  sections: string[];
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) => {
  const { Meta } = useAdapters();

  return (
    <>
      <Meta
        title={`Malanghub - ${title}`}
        description={description}
        canonical={`${siteUrl}/${title === "Kebijakan Privasi" ? "privacy" : "terms"}`}
        image={`${siteUrl}/malanghub-meta.png`}
      />
      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: title }]}
      />

      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left mb-1">{title}</h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                <span className="fa fa-calendar mr-2" />
                Terakhir diperbarui: Mei 2026
              </p>
              {children}
            </div>

            <div className="col-lg-4 mt-5 mt-lg-0">
              <div className="card p-4 mb-4">
                <h6 className="font-weight-bold mb-3">
                  <span className="fa fa-list mr-2" />
                  Daftar Isi
                </h6>
                <ol className="pl-4 mb-0" style={{ fontSize: "0.9rem" }}>
                  {sections.map((section) => (
                    <li key={section} className="mb-1">
                      {section}
                    </li>
                  ))}
                </ol>
              </div>
              {sidebar}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const TermsPage = () => {
  const { Link } = useAdapters();

  return (
    <LegalPageShell
      title="Syarat dan Ketentuan"
      description="Syarat dan Ketentuan penggunaan layanan Malanghub, portal berita dan informasi seputar Malang Raya."
      sections={termsSections}
      sidebar={
        <>
          <div className="card p-4 mb-4">
            <h6 className="font-weight-bold mb-3">
              <span className="fa fa-file-text-o mr-2" />
              Dokumen Terkait
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: "0.9rem" }}>
              <li>
                <span className="fa fa-angle-right mr-2" />
                <Link href="/privacy">Kebijakan Privasi</Link>
              </li>
              <li>
                <span className="fa fa-angle-right mr-2" />
                <Link href="/contact">Hubungi Kami</Link>
              </li>
            </ul>
          </div>
          <div className="card p-4">
            <h6 className="font-weight-bold mb-3">
              <span className="fa fa-envelope-o mr-2" />
              Ada Pertanyaan?
            </h6>
            <p style={{ fontSize: "0.9rem" }} className="mb-3">
              Hubungi tim Malanghub jika Anda memiliki pertanyaan seputar syarat
              penggunaan layanan kami.
            </p>
            <Link href="/contact" className="btn btn-style btn-primary btn-sm">
              Hubungi Kami
            </Link>
          </div>
        </>
      }
    >
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">1. Penerimaan Syarat</h5>
        <p>
          Dengan mengakses dan menggunakan situs web Malanghub
          (www.malanghub.com), Anda menyatakan telah membaca, memahami, dan
          menyetujui Syarat dan Ketentuan ini. Jika Anda tidak menyetujui
          syarat-syarat ini, mohon untuk tidak menggunakan layanan kami.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">2. Tentang Malanghub</h5>
        <p>
          Malanghub adalah portal berita dan informasi yang menyediakan konten
          seputar Malang Raya, meliputi Kota Malang, Kabupaten Malang, dan Kota
          Batu, Jawa Timur, Indonesia. Malanghub dikelola secara nirlaba untuk
          kepentingan masyarakat Malang Raya.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">3. Penggunaan Konten</h5>
        <p>
          Seluruh konten yang tersedia di Malanghub, termasuk namun tidak
          terbatas pada artikel berita, foto, dan grafis, dilindungi oleh hak
          cipta.
        </p>
        <p className="mb-1">
          <strong>Anda diperbolehkan untuk:</strong>
        </p>
        <ul className="pl-4 mb-3">
          <li>
            Membaca dan berbagi konten untuk keperluan pribadi dan
            non-komersial.
          </li>
          <li>
            Mengutip sebagian konten dengan mencantumkan sumber dan tautan ke
            artikel asli.
          </li>
        </ul>
        <p className="mb-1">
          <strong>Anda tidak diperbolehkan untuk:</strong>
        </p>
        <ul className="pl-4">
          <li>
            Menyalin, mendistribusikan, atau mereproduksi konten secara
            keseluruhan tanpa izin tertulis.
          </li>
          <li>
            Menggunakan konten untuk keperluan komersial tanpa seizin Malanghub.
          </li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">4. Akun Pengguna</h5>
        <p>
          Untuk menggunakan fitur tertentu seperti menulis berita, Anda perlu
          mendaftarkan akun. Anda bertanggung jawab untuk:
        </p>
        <ul className="pl-4">
          <li>Menjaga kerahasiaan kata sandi akun Anda.</li>
          <li>Memastikan informasi yang diberikan akurat dan terkini.</li>
          <li>Seluruh aktivitas yang terjadi melalui akun Anda.</li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">5. Konten yang Dikirimkan Pengguna</h5>
        <p>
          Dengan mengirimkan konten ke Malanghub, Anda memberikan Malanghub hak
          non-eksklusif untuk menerbitkan, mengedit, dan mendistribusikan konten
          tersebut. Malanghub berhak menolak atau menghapus konten yang:
        </p>
        <ul className="pl-4">
          <li>
            Mengandung ujaran kebencian, SARA, atau konten yang melanggar hukum.
          </li>
          <li>Bersifat spam atau menyesatkan.</li>
          <li>Melanggar hak cipta pihak ketiga.</li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">6. Penafian (Disclaimer)</h5>
        <p>
          Malanghub berupaya menyajikan informasi yang akurat dan terpercaya.
          Namun, kami tidak menjamin keakuratan, kelengkapan, atau ketepatan
          waktu dari seluruh konten. Penggunaan informasi di situs ini
          sepenuhnya merupakan tanggung jawab Anda.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">7. Batasan Tanggung Jawab</h5>
        <p>
          Malanghub tidak bertanggung jawab atas kerugian langsung maupun tidak
          langsung yang timbul akibat penggunaan atau ketidakmampuan menggunakan
          layanan ini, termasuk kerugian akibat kesalahan informasi atau
          gangguan teknis.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">8. Tautan ke Situs Pihak Ketiga</h5>
        <p>
          Malanghub dapat memuat tautan ke situs web pihak ketiga. Malanghub
          tidak bertanggung jawab atas konten, kebijakan privasi, atau praktik
          situs pihak ketiga tersebut.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">9. Perubahan Syarat dan Ketentuan</h5>
        <p>
          Malanghub berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu.
          Perubahan akan berlaku segera setelah diterbitkan di halaman ini.
          Penggunaan layanan kami secara berkelanjutan setelah perubahan
          diterbitkan berarti Anda menerima syarat yang baru.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">10. Hukum yang Berlaku</h5>
        <p className="mb-0">
          Syarat dan Ketentuan ini diatur oleh hukum yang berlaku di Republik
          Indonesia.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">11. Hubungi Kami</h5>
        <p className="mb-0">
          Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini,
          silakan hubungi kami melalui halaman{" "}
          <Link href="/contact">Kontak</Link>.
        </p>
      </div>
    </LegalPageShell>
  );
};

export const PrivacyPage = () => {
  const { Link } = useAdapters();

  return (
    <LegalPageShell
      title="Kebijakan Privasi"
      description="Kebijakan Privasi Malanghub menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna."
      sections={privacySections}
      sidebar={
        <>
          <div className="card p-4 mb-4">
            <h6 className="font-weight-bold mb-3">
              <span className="fa fa-file-text-o mr-2" />
              Dokumen Terkait
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: "0.9rem" }}>
              <li>
                <span className="fa fa-angle-right mr-2" />
                <Link href="/terms">Syarat dan Ketentuan</Link>
              </li>
              <li>
                <span className="fa fa-angle-right mr-2" />
                <Link href="/contact">Hubungi Kami</Link>
              </li>
            </ul>
          </div>
          <div className="card p-4">
            <h6 className="font-weight-bold mb-3">
              <span className="fa fa-shield mr-2" />
              Komitmen Kami
            </h6>
            <p style={{ fontSize: "0.9rem" }} className="mb-0">
              Malanghub berkomitmen menjaga privasi dan keamanan data pengguna
              sesuai dengan peraturan yang berlaku di Indonesia.
            </p>
          </div>
        </>
      }
    >
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">1. Pendahuluan</h5>
        <p className="mb-0">
          Malanghub berkomitmen untuk melindungi privasi pengguna. Kebijakan
          Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan
          melindungi informasi pribadi Anda saat menggunakan layanan di
          www.malanghub.com.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">2. Data yang Kami Kumpulkan</h5>
        <p>Kami dapat mengumpulkan data berikut:</p>
        <ul className="pl-4 mb-0">
          <li>
            <strong>Data akun:</strong> Nama, alamat email, dan kata sandi
            terenkripsi saat Anda mendaftar.
          </li>
          <li>
            <strong>Data profil:</strong> Foto profil, bio, motto, dan tautan
            media sosial yang Anda isi secara sukarela.
          </li>
          <li>
            <strong>Data penggunaan:</strong> Halaman yang dikunjungi, artikel
            yang dibaca, dan interaksi di situs.
          </li>
          <li>
            <strong>Data teknis:</strong> Alamat IP, jenis browser, dan
            perangkat yang digunakan, dikumpulkan secara otomatis.
          </li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">3. Cara Kami Menggunakan Data</h5>
        <p>Data yang dikumpulkan digunakan untuk:</p>
        <ul className="pl-4 mb-0">
          <li>Menyediakan dan meningkatkan layanan Malanghub.</li>
          <li>Mengelola akun dan autentikasi pengguna.</li>
          <li>Menampilkan konten yang relevan.</li>
          <li>Menganalisis trafik dan performa situs.</li>
          <li>Mencegah penyalahgunaan dan menjaga keamanan platform.</li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">4. Layanan Pihak Ketiga</h5>
        <p>
          Malanghub menggunakan layanan pihak ketiga berikut yang memiliki
          kebijakan privasi masing-masing:
        </p>
        <ul className="pl-4 mb-0">
          <li>
            <strong>Google Analytics & Google OAuth:</strong> Untuk analitik dan
            masuk dengan akun Google.
          </li>
          <li>
            <strong>Cloudflare:</strong> Untuk keamanan, CDN, dan analitik web.
          </li>
          <li>
            <strong>Cloudinary:</strong> Untuk penyimpanan dan pengelolaan
            gambar.
          </li>
          <li>
            <strong>Sentry:</strong> Untuk pemantauan dan pelaporan error
            teknis.
          </li>
          <li>
            <strong>Google Reader Revenue Manager:</strong> Untuk fitur
            publikasi berita.
          </li>
        </ul>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">5. Cookie</h5>
        <p className="mb-0">
          Malanghub menggunakan cookie untuk menjaga sesi login dan meningkatkan
          pengalaman pengguna. Anda dapat menonaktifkan cookie melalui
          pengaturan browser, namun beberapa fitur situs mungkin tidak berfungsi
          dengan baik.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">6. Keamanan Data</h5>
        <p className="mb-0">
          Kami menerapkan langkah-langkah keamanan teknis yang wajar untuk
          melindungi data Anda, termasuk enkripsi kata sandi dan koneksi HTTPS.
          Namun, tidak ada sistem yang sepenuhnya aman, dan kami tidak dapat
          menjamin keamanan absolut.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">7. Hak Pengguna</h5>
        <p>Anda memiliki hak untuk:</p>
        <ul className="pl-4 mb-3">
          <li>Mengakses dan memperbarui data profil Anda kapan saja.</li>
          <li>Meminta penghapusan akun dan data pribadi Anda.</li>
          <li>Menarik persetujuan penggunaan data Anda.</li>
        </ul>
        <p className="mb-0">
          Untuk menggunakan hak-hak ini, silakan hubungi kami melalui halaman{" "}
          <Link href="/contact">Kontak</Link>.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">8. Data Anak-Anak</h5>
        <p className="mb-0">
          Layanan Malanghub tidak ditujukan bagi anak-anak di bawah usia 13
          tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari
          anak-anak.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">9. Perubahan Kebijakan Privasi</h5>
        <p className="mb-0">
          Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan
          akan diberitahukan melalui halaman ini dengan memperbarui tanggal di
          bagian atas. Penggunaan layanan secara berkelanjutan setelah perubahan
          berarti Anda menerima kebijakan yang baru.
        </p>
      </div>
      <div className="card mb-4 p-4">
        <h5 className="font-weight-bold">10. Hubungi Kami</h5>
        <p className="mb-0">
          Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan
          hubungi kami melalui halaman <Link href="/contact">Kontak</Link>.
        </p>
      </div>
    </LegalPageShell>
  );
};

export const NotFoundPage = () => (
  <StaticPage title="Halaman Tidak Ditemukan">
    <p>Halaman yang dicari tidak tersedia.</p>
  </StaticPage>
);

export const NativeDraftEditorPage = () => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const categories = useCategories(api);
  const tags = useTags(api);
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    tags: [] as string[],
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.drafts.create({
        title: form.title,
        category: form.category,
        content: form.content,
        tags: form.tags,
      });
      notify("Draft berhasil dibuat", "success");
      adapters.navigate("/users");
    } catch (error) {
      adapters.reportError?.(error);
      notify(
        error instanceof Error ? error.message : "Gagal membuat draft",
        "danger",
      );
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/users" },
          { label: "Tulis Draft" },
        ]}
      />
      <section className="w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <h3 className="section-title-left">Tulis Draft</h3>
          <form className="malanghub-profile-form" onSubmit={submit}>
            <input
              value={form.title}
              placeholder="Judul"
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <input value={createSlug(form.title)} placeholder="Slug" readOnly />
            <select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              <option value="">Pilih kategori</option>
              {categories.data?.map((category) => (
                <option key={category._id} value={category.id ?? category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              multiple
              value={form.tags}
              onChange={(event) =>
                setForm({
                  ...form,
                  tags: Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                })
              }
            >
              {tags.data?.map((tag) => (
                <option key={tag._id} value={tag.id ?? tag._id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <textarea
              rows={12}
              value={form.content}
              placeholder="Konten berita"
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
            />
            <button className="btn btn-style btn-primary" type="submit">
              Simpan Draft
            </button>
          </form>
        </div>
      </section>
    </>
  );
};
