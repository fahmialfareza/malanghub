import React, { useMemo, useState } from "react";
import {
  type AuthResponse,
  type News,
  type NewsListParams,
  type PaginatedResponse,
  useCategories,
  useCategoryDetail,
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
  useUserProfile,
} from "@malanghub/core";
import { useAdapters } from "./adapters";
import { useMalanghubRuntime } from "./providers";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  buttonClass,
  cardClass,
  cx,
} from "./primitives";
import {
  ArticleView,
  EmptyState,
  LoadingState,
  PageBreadcrumbs,
  PageSection,
  ProfileHeader,
  SectionTitle,
  TwoColumnLayout,
  linkClass,
} from "./content";
import {
  createSlug,
  excerpt,
  formatDate,
  getAuthorHref,
  getCategoryHref,
  getCategoryName,
  readingTime,
  siteUrl,
} from "./utils";

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

const titleLinkClass =
  "font-heading font-bold leading-snug text-fg no-underline transition-colors hover:text-brand";

const NewsImage = ({ news }: { news: News }) => {
  const { Image } = useAdapters();
  return (
    <Image
      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
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
    <div className="mt-3 text-sm">
      <div className="text-body">
        <Link href={getAuthorHref(news)} className={linkClass}>
          {news.user?.name ?? "Penulis"}
        </Link>{" "}
        di{" "}
        <Link href={getCategoryHref(news)} className={linkClass}>
          {getCategoryName(news)}
        </Link>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="fa fa-calendar-o" aria-hidden="true" />
          {formatDate(news.created_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="fa fa-clock-o" aria-hidden="true" />
          {readingTime(news)}
        </span>
      </div>
    </div>
  );
};

const NewsCard = ({ news, featured }: { news: News; featured?: boolean }) => {
  const { Link } = useAdapters();

  return (
    <article
      className={cx(
        cardClass,
        "group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-pop",
      )}
    >
      <Link
        href={`/news/${news.slug}`}
        className={cx(
          "relative block overflow-hidden bg-surface-2",
          featured ? "aspect-video" : "aspect-[4/3]",
        )}
      >
        <NewsImage news={news} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/news/${news.slug}`}
          className={cx(
            titleLinkClass,
            featured ? "text-2xl" : "text-lg",
          )}
        >
          {news.title}
        </Link>
        <p className="mt-2 line-clamp-2 text-[0.95rem] leading-6 text-muted">
          {excerpt(news.content, 120)}
        </p>
        <div className="mt-auto">
          <NewsMeta news={news} />
        </div>
      </div>
    </article>
  );
};

/** Compact horizontal item: thumbnail + title + meta. */
const NewsListItem = ({ news }: { news: News }) => {
  const { Link } = useAdapters();

  return (
    <article className="group flex gap-4">
      <Link
        href={`/news/${news.slug}`}
        className="relative block aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-32"
      >
        <NewsImage news={news} />
      </Link>
      <div className="min-w-0 self-center">
        <Link
          href={`/news/${news.slug}`}
          className={cx(titleLinkClass, "line-clamp-3 text-base sm:text-lg")}
        >
          {news.title}
        </Link>
        <NewsMeta news={news} />
      </div>
    </article>
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

const pageButtonClass = (active?: boolean) =>
  cx(
    "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
    active
      ? "border-brand bg-brand text-brand-fg"
      : "border-line bg-surface text-body hover:border-brand hover:text-brand",
  );

const Pagination = ({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange(page: number): void;
}) => (
  <nav aria-label="Navigasi halaman" className="mt-10">
    <ul className="m-0 flex flex-wrap items-center justify-center gap-1.5 p-0 list-none">
      <li>
        <button
          type="button"
          className={pageButtonClass()}
          aria-label="Halaman sebelumnya"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <span className="fa fa-angle-left" aria-hidden="true" />
        </button>
      </li>
      {buildPageList(page, pageCount).map((item, index) =>
        item === "..." ? (
          <li
            key={`ellipsis-${index}`}
            className="px-1.5 text-muted"
            aria-hidden="true"
          >
            ...
          </li>
        ) : (
          <li key={item}>
            <button
              type="button"
              className={pageButtonClass(page === item)}
              aria-current={page === item ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          </li>
        ),
      )}
      <li>
        <button
          type="button"
          className={pageButtonClass()}
          aria-label="Halaman berikutnya"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="fa fa-angle-right" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </nav>
);

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
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {news.map((item, index) => (
          <div key={item._id} className={index === 0 ? "sm:col-span-2" : ""}>
            <NewsCard news={item} featured={index === 0} />
          </div>
        ))}
      </div>
      {onPageChange && pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

const HomeNews = ({ news }: { news: News[] }) => {
  const { Link } = useAdapters();

  if (!news.length) return <EmptyState>Belum Ada Berita</EmptyState>;

  const [featured, ...rest] = news;

  return (
    <div className="grid gap-8 md:grid-cols-12">
      <div className="md:col-span-6 lg:col-span-5">
        <NewsCard news={featured} />
        <Link
          href="/news"
          className={buttonClass({
            variant: "secondary",
            block: true,
            className: "mt-4",
          })}
        >
          Semua Berita
          <span className="fa fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex flex-col gap-6 md:col-span-6 lg:col-span-7">
        {rest.map((item) => (
          <NewsListItem key={item._id} news={item} />
        ))}
      </div>
    </div>
  );
};

const TrendingList = ({ news }: { news: News[] }) => {
  const { Link } = useAdapters();

  if (!news.length) return <EmptyState>Belum Ada Berita</EmptyState>;

  return (
    <ol className={cx(cardClass, "m-0 divide-y divide-line p-0 list-none")}>
      {news.map((item, index) => (
        <li key={item._id} className="flex gap-4 p-5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft font-heading text-base font-bold text-brand"
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <Link
              href={`/news/${item.slug}`}
              className={cx(titleLinkClass, "text-base")}
            >
              {item.title}
            </Link>
            <NewsMeta news={item} />
          </div>
        </li>
      ))}
    </ol>
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
  <PageSection>
    <TwoColumnLayout
      main={
        <>
          <SectionTitle>{title}</SectionTitle>
          {children}
        </>
      }
      aside={
        <>
          <SectionTitle className="text-xl">Trending</SectionTitle>
          <TrendingList news={trending ?? []} />
        </>
      }
    />
  </PageSection>
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
      <PageSection className="sm:pt-14">
        <TwoColumnLayout
          wideMain
          main={
            <>
              <SectionTitle>Berita Terbaru</SectionTitle>
              {recent.isLoading ? (
                <LoadingState />
              ) : (
                <HomeNews news={recent.data?.data ?? []} />
              )}
            </>
          }
          aside={
            <>
              <SectionTitle className="text-xl">Trending</SectionTitle>
              {trending.isLoading ? (
                <LoadingState />
              ) : (
                <TrendingList news={trending.data?.data ?? []} />
              )}
            </>
          }
        />
      </PageSection>
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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Semua Berita" }]}
      />
      <TwoColumnNewsLayout title="Semua Berita" trending={trending.data?.data}>
        {news.isLoading ? (
          <LoadingState />
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
      <PageBreadcrumbs
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
          <LoadingState />
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
      <PageBreadcrumbs
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
          <LoadingState />
        ) : (
          <NewsGrid response={news.data} onPageChange={setPage} />
        )}
      </TwoColumnNewsLayout>
    </>
  );
};

export const NewsDetailPage = ({ slug }: { slug?: string }) => {
  const { api } = useMalanghubRuntime();
  const { Meta } = useAdapters();
  const news = useNewsDetail(api, slug);
  const related = useRelatedNews(api, news.data);

  if (news.isLoading) return <LoadingState />;
  if (!news.data) {
    return (
      <PageSection>
        <EmptyState>Berita tidak ditemukan</EmptyState>
      </PageSection>
    );
  }

  const currentNews = news.data;

  return (
    <>
      <Meta
        title={`Malanghub - Berita - ${currentNews.title}`}
        description={excerpt(currentNews.content)}
        canonical={`${siteUrl}/news/${currentNews.slug}`}
        image={currentNews.mainImage}
      />
      <PageBreadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Berita", href: "/news" },
          { label: currentNews.title },
        ]}
      />
      <ArticleView
        news={currentNews}
        content={
          <div dangerouslySetInnerHTML={{ __html: currentNews.content }} />
        }
        tagsLabel="Tag :"
        shareLabel="Bagikan :"
        shareLinks={[
          {
            icon: "fa-facebook",
            label: "Bagikan ke Facebook",
            href: `https://www.facebook.com/share.php?u=${siteUrl}/news/${currentNews.slug}`,
            external: true,
          },
          {
            icon: "fa-twitter",
            label: "Bagikan ke Twitter",
            href: `https://twitter.com/intent/tweet?text=${siteUrl}/news/${currentNews.slug}`,
            external: true,
          },
        ]}
        asideTitle="Mungkin Anda Tertarik"
        aside={
          related.isLoading ? (
            <LoadingState />
          ) : (
            <TrendingList news={related.data?.data ?? []} />
          )
        }
      />
    </>
  );
};

const AuthCard = ({
  title,
  providers,
  children,
}: {
  title: string;
  providers: React.ReactNode;
  children: React.ReactNode;
}) => (
  <PageSection>
    <Card className="mx-auto max-w-md p-6 sm:p-8">
      <h1 className="m-0 mb-6 text-center font-heading text-2xl font-bold text-fg">
        {title}
      </h1>
      <div className="flex w-full flex-col gap-3">{providers}</div>
      <div
        className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>
      {children}
    </Card>
  </PageSection>
);

const providerButtonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-[0.95rem] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60";

const AppleAuthButton = ({
  label,
  onSuccess,
}: {
  label: "Masuk" | "Daftar";
  onSuccess(data: AuthResponse): void | Promise<void>;
}) => {
  const { notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const [loading, setLoading] = useState(false);

  if (!adapters.appleAuthAvailable || !adapters.requestAppleAuth) return null;

  const onAppleAuth = async () => {
    setLoading(true);
    try {
      const auth = await adapters.requestAppleAuth!();
      await onSuccess(auth);
    } catch (error) {
      adapters.reportError?.(error);
      const msg =
        error instanceof Error && error.message.trim()
          ? error.message
          : typeof error === "string" && error.trim()
            ? error
            : "Apple Sign In gagal";
      notify(msg, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onAppleAuth()}
      className={cx(
        providerButtonClass,
        "border-transparent bg-fg text-bg hover:opacity-90",
      )}
      disabled={loading}
    >
      <span className="fa fa-apple text-lg" aria-hidden="true" />
      <span>
        {loading ? "Memproses..." : `${label} dengan`} <b>Apple</b>
      </span>
    </button>
  );
};

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

  const onGoogleAuth = async () => {
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
      <button
        type="button"
        onClick={() => void onGoogleAuth()}
        className={cx(
          providerButtonClass,
          "border-line-strong bg-surface text-fg hover:bg-surface-2",
        )}
        aria-disabled={!available || undefined}
        disabled={loading}
      >
        <span className="fa fa-google text-lg text-danger" aria-hidden="true" />
        <span>
          {loading ? "Memproses..." : `${label} dengan`} <b>Google</b>
        </span>
      </button>
      {!available && (
        <div className="rounded-lg border-l-4 border-brand bg-brand-soft px-3 py-2.5 text-sm text-body">
          {adapters.googleAuthUnavailableMessage ??
            "Isi Google client ID untuk mengaktifkan Google login."}
        </div>
      )}
    </>
  );
};

const AuthSwitch = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-6 text-center text-sm font-semibold text-body">
    {children}
  </p>
);

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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Masuk" }]}
      />
      <AuthCard
        title="Masuk"
        providers={
          <>
            <AppleAuthButton label="Masuk" onSuccess={onAuthSuccess} />
            <GoogleAuthButton label="Masuk" onSuccess={onAuthSuccess} />
          </>
        }
      >
        <form onSubmit={submit}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email*"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password*"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            required
          />
          <Button
            type="submit"
            block
            className="mt-2"
            loading={signIn.isPending}
          >
            Masuk
          </Button>
          <AuthSwitch>
            Belum punya akun?{" "}
            <Link href="/signup" className={linkClass}>
              Daftar sekarang
            </Link>
          </AuthSwitch>
        </form>
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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Daftar" }]}
      />
      <AuthCard
        title="Daftar"
        providers={
          <>
            <AppleAuthButton label="Daftar" onSuccess={onAuthSuccess} />
            <GoogleAuthButton label="Daftar" onSuccess={onAuthSuccess} />
          </>
        }
      >
        <form onSubmit={submit}>
          <Input
            label="Nama"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Nama*"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email*"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password*"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            required
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            name="passwordConfirmation"
            autoComplete="new-password"
            placeholder="Konfirmasi Password*"
            value={form.passwordConfirmation}
            onChange={(event) =>
              setForm({
                ...form,
                passwordConfirmation: event.target.value,
              })
            }
            required
          />
          <Button
            type="submit"
            block
            className="mt-2"
            loading={signUp.isPending}
          >
            Daftar
          </Button>
          <AuthSwitch>
            Sudah punya akun?{" "}
            <Link href="/signin" className={linkClass}>
              Masuk
            </Link>
          </AuthSwitch>
        </form>
      </AuthCard>
    </>
  );
};

export const UserProfilePage = ({ id }: { id?: string }) => {
  const { api } = useMalanghubRuntime();
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
      <PageBreadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Pengguna" },
          { label: user?.name ?? id ?? "" },
        ]}
      />
      {userQuery.isLoading ? (
        <LoadingState />
      ) : userQuery.isError ? (
        <PageSection>
          <EmptyState>
            Pengguna tidak ditemukan.
            <Button
              variant="secondary"
              onClick={() => void userQuery.refetch()}
            >
              Coba Lagi
            </Button>
          </EmptyState>
        </PageSection>
      ) : (
        <ProfileHeader user={user} />
      )}

      <PageSection>
        <TwoColumnLayout
          wideMain
          main={
            <>
              <SectionTitle>Berita dari {user?.name ?? "Pengguna"}</SectionTitle>
              {profileNews.isLoading ? (
                <LoadingState />
              ) : (
                <NewsGrid response={profileNews.data} onPageChange={setPage} />
              )}
            </>
          }
          aside={
            <>
              <SectionTitle className="text-xl">
                Trending oleh {user?.name ?? "Pengguna"}
              </SectionTitle>
              {trendingByUser.isLoading ? (
                <LoadingState />
              ) : (
                <TrendingList news={trendingByUser.data?.data ?? []} />
              )}
            </>
          }
        />
      </PageSection>
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
    <PageBreadcrumbs items={[{ label: "Beranda", href: "/" }, { label: title }]} />
    <PageSection>
      <SectionTitle as="h1">{title}</SectionTitle>
      <div className="max-w-3xl leading-relaxed text-body">
        {children}
      </div>
    </PageSection>
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

const STORE_BADGE: Record<string, [string, string]> = {
  iOS: ["Download on the", "App Store"],
  macOS: ["Download on the", "Mac App Store"],
  Android: ["Get it on", "Google Play"],
  Windows: ["Get it from", "Microsoft"],
  Linux: ["Get it from the", "Snap Store"],
};

const StoreBadge = ({
  item,
  onClick,
  className,
}: {
  item: DownloadLink;
  onClick?: () => void;
  className?: string;
}) => {
  const isExternal = Boolean(item.href && /^(https?:)?\/\//.test(item.href));
  const [badgeTop, badgeBottom] = STORE_BADGE[item.platform] ?? [
    "Unduh dari",
    item.platform,
  ];

  return (
    <a
      className={cx(
        "inline-flex min-w-36 items-center gap-2.5 rounded-lg bg-fg px-4 py-2 text-bg no-underline transition-opacity hover:text-bg hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
        className,
      )}
      href={item.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      onClick={onClick}
    >
      <span
        className={`fa ${item.icon} shrink-0 text-2xl leading-none`}
        aria-hidden="true"
      />
      <span className="flex flex-col text-left">
        <span className="text-[0.65rem] font-normal leading-tight opacity-85">
          {badgeTop}
        </span>
        <span className="whitespace-nowrap text-base font-bold leading-tight">
          {badgeBottom}
        </span>
      </span>
    </a>
  );
};

const DownloadCard = ({ item }: { item: DownloadLink }) => (
  <article
    className={cx(
      cardClass,
      "flex items-start gap-4 p-5 sm:p-6",
      !item.href && "opacity-75 shadow-none",
    )}
  >
    <div
      className={cx(
        "flex size-14 shrink-0 items-center justify-center rounded-xl",
        item.href ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted",
      )}
    >
      <span className={`fa ${item.icon} text-3xl leading-none`} aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <h3 className="m-0 mb-2 font-heading text-xl font-bold text-fg">
        {item.platform}
      </h3>
      <p className="mb-4 text-[0.95rem] leading-6 text-body">
        {item.description}
      </p>
      {item.href ? (
        <StoreBadge item={item} />
      ) : (
        <span className="inline-flex min-h-10 items-center rounded-lg border border-line-strong px-3.5 text-sm font-bold text-muted">
          {item.status ?? "Segera hadir"}
        </span>
      )}
    </div>
  </article>
);

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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Download" }]}
      />
      <PageSection>
        <div className="grid items-start gap-10 lg:grid-cols-3">
          <div className="lg:sticky lg:top-24">
            <span className="mb-3 inline-flex text-xs font-extrabold uppercase tracking-wider text-brand">
              Aplikasi Native
            </span>
            <SectionTitle as="h1">Download Malanghub</SectionTitle>
            <p className="mb-5 text-base leading-7 text-body">
              Baca berita, kelola draft, dan masuk ke akun Malanghub dari
              aplikasi desktop maupun mobile.
            </p>
            <Link href="/contact" className={linkClass}>
              Butuh bantuan instalasi?
            </Link>
          </div>

          <div className="flex flex-col gap-10 lg:col-span-2">
            {[
              { title: "Mobile", items: mobileLinks },
              { title: "Desktop", items: desktopLinks },
            ].map((section) => (
              <section key={section.title}>
                <h2 className="m-0 mb-4 font-heading text-xl font-bold text-fg">
                  {section.title}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map((item) => (
                    <DownloadCard key={item.platform} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </PageSection>
    </>
  );
};

export const AppDownloadBanner = ({
  links,
}: {
  links: DownloadLink[];
}) => {
  const [visible, setVisible] = React.useState(false);
  const [match, setMatch] = React.useState<DownloadLink | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if ("__TAURI_INTERNALS__" in window) return;
    if (window.location.pathname === "/download") return;
    if (sessionStorage.getItem("mh-banner-dismissed")) return;

    const ua = navigator.userAgent;
    let platform: string | null = null;
    if (/iPhone|iPad|iPod/i.test(ua)) platform = "iOS";
    else if (/Android/i.test(ua)) platform = "Android";
    else if (/Win/i.test(ua)) platform = "Windows";
    else if (/Macintosh|Mac OS X/i.test(ua)) platform = "macOS";
    else if (/Linux/i.test(ua)) platform = "Linux";

    if (!platform) return;
    const link = links.find((l) => l.platform === platform && l.href);
    if (!link) return;

    setMatch(link);
    setVisible(true);
  }, [links]);

  const dismiss = () => {
    sessionStorage.setItem("mh-banner-dismissed", "1");
    setVisible(false);
  };

  if (!visible || !match) return null;

  return (
    <div
      role="region"
      aria-label="Download aplikasi Malanghub"
      className="relative z-[1035] flex items-center gap-3 border-b border-line bg-surface px-4 py-3 shadow-card sm:px-5"
    >
      <div
        className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand sm:flex"
        aria-hidden="true"
      >
        <span className={`fa ${match.icon} text-2xl`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="text-[0.95rem] font-bold leading-snug text-fg">
          Download Malanghub
        </strong>
        <span className="hidden truncate text-sm text-muted sm:block">
          {match.description}
        </span>
      </div>
      <StoreBadge item={match} onClick={dismiss} className="shrink-0" />
      <button
        type="button"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-2xl leading-none text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        onClick={dismiss}
        aria-label="Tutup"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
};

const ContactItem = ({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-4">
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg text-brand"
      aria-hidden="true"
    >
      <span className={`fa ${icon}`} />
    </span>
    <div className="min-w-0 [&_p]:text-body">
      <h3 className="m-0 mb-1 font-heading text-base font-bold text-fg">
        {title}
      </h3>
      {children}
    </div>
  </div>
);

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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Kontak" }]}
      />
      <PageSection>
        <SectionTitle as="h1">Tinggalkan pesan untuk kami</SectionTitle>
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <h2 className="m-0 mb-3 font-heading text-xl font-bold text-fg">
              Kontak Kami
            </h2>
            <div className="space-y-3">
              <p>
                Semuanya dimulai dengan Halo! Kami di sini menjawab apa pun
                pertanyaan yang mungkin Anda miliki dan memberikan solusi
                efektif untuk Anda tentang layanan Malanghub.
              </p>
              <p>
                Kami memiliki pusat dukungan khusus untuk semua dukungan Anda.
                Kami biasanya akan menghubungi Anda dalam waktu 12-24 jam.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-6">
              <ContactItem icon="fa-map-marker" title="Alamat">
                <p>Perum. Bumi Madinah Blok C3</p>
                <p>Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151</p>
                <p className="mt-1">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={MALANGHUB_MAPS_NAVIGATION_URL}
                    className={linkClass}
                  >
                    Buka Navigasi Google Maps
                  </a>
                </p>
              </ContactItem>
              <ContactItem icon="fa-phone" title="Whatsapp Kami">
                <p className="flex items-center gap-2">
                  <span className="fa fa-whatsapp text-success" aria-hidden="true" />
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://wa.me/62895424785888"
                    className={linkClass}
                  >
                    0895424785888
                  </a>
                </p>
              </ContactItem>
              <ContactItem icon="fa-envelope-o" title="Email Kami">
                <p>
                  <a href="mailto:admin@malanghub.com" className={linkClass}>
                    admin@malanghub.com
                  </a>
                </p>
              </ContactItem>
            </div>
          </Card>
          <div className="malanghub-map-embed overflow-hidden rounded-xl border border-line shadow-card">
            <div className="relative aspect-square bg-surface-2">
              <iframe
                title="Lokasi Malanghub"
                className="absolute inset-0 size-full border-0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.6257545166436!2d112.56973751477908!3d-7.934097594284932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7883c600d082fd%3A0x3f1caf9c821540c1!2sPerum.%20Bumi%20Madinah%20Blok%20C%202!5e0!3m2!1sen!2sid!4v1614682193710!5m2!1sen!2sid"
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
      </PageSection>
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

const bulletListClass =
  "m-0 space-y-1.5 pl-5 text-base leading-7 text-body [&>li]:list-disc";

const LegalSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="p-6">
    <h2 className="m-0 mb-3 font-heading text-lg font-bold text-fg">
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </Card>
);

const SidebarCard = ({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="p-6">
    <h2 className="m-0 mb-3 flex items-center gap-2 text-base font-bold text-fg">
      <span className={`fa ${icon} text-brand`} aria-hidden="true" />
      {title}
    </h2>
    {children}
  </Card>
);

const RelatedLinks = ({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) => {
  const { Link } = useAdapters();

  return (
    <ul className="m-0 space-y-1.5 p-0 text-sm list-none">
      {links.map((link) => (
        <li key={link.href} className="flex items-center gap-2">
          <span className="fa fa-angle-right text-muted" aria-hidden="true" />
          <Link href={link.href} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

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
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: title }]}
      />

      <PageSection>
        <TwoColumnLayout
          main={
            <>
              <SectionTitle as="h1" className="mb-2">
                {title}
              </SectionTitle>
              <p className="mb-6 flex items-center gap-2 text-sm text-muted">
                <span className="fa fa-calendar" aria-hidden="true" />
                Terakhir diperbarui: Mei 2026
              </p>
              <div className="flex flex-col gap-4">{children}</div>
            </>
          }
          aside={
            <div className="flex flex-col gap-4">
              <SidebarCard icon="fa-list" title="Daftar Isi">
                <ol className="m-0 space-y-1 pl-5 text-sm text-body [&>li]:list-decimal">
                  {sections.map((section) => (
                    <li key={section}>{section}</li>
                  ))}
                </ol>
              </SidebarCard>
              {sidebar}
            </div>
          }
        />
      </PageSection>
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
          <SidebarCard icon="fa-file-text-o" title="Dokumen Terkait">
            <RelatedLinks
              links={[
                { href: "/privacy", label: "Kebijakan Privasi" },
                { href: "/contact", label: "Hubungi Kami" },
              ]}
            />
          </SidebarCard>
          <SidebarCard icon="fa-envelope-o" title="Ada Pertanyaan?">
            <p className="mb-4 text-sm leading-6">
              Hubungi tim Malanghub jika Anda memiliki pertanyaan seputar syarat
              penggunaan layanan kami.
            </p>
            <Link href="/contact" className={buttonClass({ size: "sm" })}>
              Hubungi Kami
            </Link>
          </SidebarCard>
        </>
      }
    >
      <LegalSection title="1. Penerimaan Syarat">
        <p>
          Dengan mengakses dan menggunakan situs web Malanghub
          (www.malanghub.com), Anda menyatakan telah membaca, memahami, dan
          menyetujui Syarat dan Ketentuan ini. Jika Anda tidak menyetujui
          syarat-syarat ini, mohon untuk tidak menggunakan layanan kami.
        </p>
      </LegalSection>
      <LegalSection title="2. Tentang Malanghub">
        <p>
          Malanghub adalah portal berita dan informasi yang menyediakan konten
          seputar Malang Raya, meliputi Kota Malang, Kabupaten Malang, dan Kota
          Batu, Jawa Timur, Indonesia. Malanghub dikelola secara nirlaba untuk
          kepentingan masyarakat Malang Raya.
        </p>
      </LegalSection>
      <LegalSection title="3. Penggunaan Konten">
        <p>
          Seluruh konten yang tersedia di Malanghub, termasuk namun tidak
          terbatas pada artikel berita, foto, dan grafis, dilindungi oleh hak
          cipta.
        </p>
        <p>
          <strong className="text-fg">Anda diperbolehkan untuk:</strong>
        </p>
        <ul className={bulletListClass}>
          <li>
            Membaca dan berbagi konten untuk keperluan pribadi dan
            non-komersial.
          </li>
          <li>
            Mengutip sebagian konten dengan mencantumkan sumber dan tautan ke
            artikel asli.
          </li>
        </ul>
        <p>
          <strong className="text-fg">Anda tidak diperbolehkan untuk:</strong>
        </p>
        <ul className={bulletListClass}>
          <li>
            Menyalin, mendistribusikan, atau mereproduksi konten secara
            keseluruhan tanpa izin tertulis.
          </li>
          <li>
            Menggunakan konten untuk keperluan komersial tanpa seizin Malanghub.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Akun Pengguna">
        <p>
          Untuk menggunakan fitur tertentu seperti menulis berita, Anda perlu
          mendaftarkan akun. Anda bertanggung jawab untuk:
        </p>
        <ul className={bulletListClass}>
          <li>Menjaga kerahasiaan kata sandi akun Anda.</li>
          <li>Memastikan informasi yang diberikan akurat dan terkini.</li>
          <li>Seluruh aktivitas yang terjadi melalui akun Anda.</li>
        </ul>
      </LegalSection>
      <LegalSection title="5. Konten yang Dikirimkan Pengguna">
        <p>
          Dengan mengirimkan konten ke Malanghub, Anda memberikan Malanghub hak
          non-eksklusif untuk menerbitkan, mengedit, dan mendistribusikan konten
          tersebut. Malanghub berhak menolak atau menghapus konten yang:
        </p>
        <ul className={bulletListClass}>
          <li>
            Mengandung ujaran kebencian, SARA, atau konten yang melanggar hukum.
          </li>
          <li>Bersifat spam atau menyesatkan.</li>
          <li>Melanggar hak cipta pihak ketiga.</li>
        </ul>
      </LegalSection>
      <LegalSection title="6. Penafian (Disclaimer)">
        <p>
          Malanghub berupaya menyajikan informasi yang akurat dan terpercaya.
          Namun, kami tidak menjamin keakuratan, kelengkapan, atau ketepatan
          waktu dari seluruh konten. Penggunaan informasi di situs ini
          sepenuhnya merupakan tanggung jawab Anda.
        </p>
      </LegalSection>
      <LegalSection title="7. Batasan Tanggung Jawab">
        <p>
          Malanghub tidak bertanggung jawab atas kerugian langsung maupun tidak
          langsung yang timbul akibat penggunaan atau ketidakmampuan menggunakan
          layanan ini, termasuk kerugian akibat kesalahan informasi atau
          gangguan teknis.
        </p>
      </LegalSection>
      <LegalSection title="8. Tautan ke Situs Pihak Ketiga">
        <p>
          Malanghub dapat memuat tautan ke situs web pihak ketiga. Malanghub
          tidak bertanggung jawab atas konten, kebijakan privasi, atau praktik
          situs pihak ketiga tersebut.
        </p>
      </LegalSection>
      <LegalSection title="9. Perubahan Syarat dan Ketentuan">
        <p>
          Malanghub berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu.
          Perubahan akan berlaku segera setelah diterbitkan di halaman ini.
          Penggunaan layanan kami secara berkelanjutan setelah perubahan
          diterbitkan berarti Anda menerima syarat yang baru.
        </p>
      </LegalSection>
      <LegalSection title="10. Hukum yang Berlaku">
        <p>
          Syarat dan Ketentuan ini diatur oleh hukum yang berlaku di Republik
          Indonesia.
        </p>
      </LegalSection>
      <LegalSection title="11. Hubungi Kami">
        <p>
          Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini,
          silakan hubungi kami melalui halaman{" "}
          <Link href="/contact" className={linkClass}>
            Kontak
          </Link>
          .
        </p>
      </LegalSection>
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
          <SidebarCard icon="fa-file-text-o" title="Dokumen Terkait">
            <RelatedLinks
              links={[
                { href: "/terms", label: "Syarat dan Ketentuan" },
                { href: "/contact", label: "Hubungi Kami" },
              ]}
            />
          </SidebarCard>
          <SidebarCard icon="fa-shield" title="Komitmen Kami">
            <p className="text-sm leading-6">
              Malanghub berkomitmen menjaga privasi dan keamanan data pengguna
              sesuai dengan peraturan yang berlaku di Indonesia.
            </p>
          </SidebarCard>
        </>
      }
    >
      <LegalSection title="1. Pendahuluan">
        <p>
          Malanghub berkomitmen untuk melindungi privasi pengguna. Kebijakan
          Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan
          melindungi informasi pribadi Anda saat menggunakan layanan di
          www.malanghub.com.
        </p>
      </LegalSection>
      <LegalSection title="2. Data yang Kami Kumpulkan">
        <p>Kami dapat mengumpulkan data berikut:</p>
        <ul className={bulletListClass}>
          <li>
            <strong className="text-fg">Data akun:</strong> Nama, alamat
            email, dan kata sandi terenkripsi saat Anda mendaftar.
          </li>
          <li>
            <strong className="text-fg">Data profil:</strong> Foto profil,
            bio, motto, dan tautan media sosial yang Anda isi secara sukarela.
          </li>
          <li>
            <strong className="text-fg">Data penggunaan:</strong> Halaman
            yang dikunjungi, artikel yang dibaca, dan interaksi di situs.
          </li>
          <li>
            <strong className="text-fg">Data teknis:</strong> Alamat IP,
            jenis browser, dan perangkat yang digunakan, dikumpulkan secara
            otomatis.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Cara Kami Menggunakan Data">
        <p>Data yang dikumpulkan digunakan untuk:</p>
        <ul className={bulletListClass}>
          <li>Menyediakan dan meningkatkan layanan Malanghub.</li>
          <li>Mengelola akun dan autentikasi pengguna.</li>
          <li>Menampilkan konten yang relevan.</li>
          <li>Menganalisis trafik dan performa situs.</li>
          <li>Mencegah penyalahgunaan dan menjaga keamanan platform.</li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Layanan Pihak Ketiga">
        <p>
          Malanghub menggunakan layanan pihak ketiga berikut yang memiliki
          kebijakan privasi masing-masing:
        </p>
        <ul className={bulletListClass}>
          <li>
            <strong className="text-fg">
              Google Analytics & Google OAuth:
            </strong>{" "}
            Untuk analitik dan masuk dengan akun Google.
          </li>
          <li>
            <strong className="text-fg">Cloudflare:</strong> Untuk keamanan,
            CDN, dan analitik web.
          </li>
          <li>
            <strong className="text-fg">Cloudinary:</strong> Untuk
            penyimpanan dan pengelolaan gambar.
          </li>
          <li>
            <strong className="text-fg">Sentry:</strong> Untuk pemantauan
            dan pelaporan error teknis.
          </li>
          <li>
            <strong className="text-fg">
              Google Reader Revenue Manager:
            </strong>{" "}
            Untuk fitur publikasi berita.
          </li>
        </ul>
      </LegalSection>
      <LegalSection title="5. Cookie">
        <p>
          Malanghub menggunakan cookie untuk menjaga sesi login dan meningkatkan
          pengalaman pengguna. Anda dapat menonaktifkan cookie melalui
          pengaturan browser, namun beberapa fitur situs mungkin tidak berfungsi
          dengan baik.
        </p>
      </LegalSection>
      <LegalSection title="6. Keamanan Data">
        <p>
          Kami menerapkan langkah-langkah keamanan teknis yang wajar untuk
          melindungi data Anda, termasuk enkripsi kata sandi dan koneksi HTTPS.
          Namun, tidak ada sistem yang sepenuhnya aman, dan kami tidak dapat
          menjamin keamanan absolut.
        </p>
      </LegalSection>
      <LegalSection title="7. Hak Pengguna">
        <p>Anda memiliki hak untuk:</p>
        <ul className={bulletListClass}>
          <li>Mengakses dan memperbarui data profil Anda kapan saja.</li>
          <li>Meminta penghapusan akun dan data pribadi Anda.</li>
          <li>Menarik persetujuan penggunaan data Anda.</li>
        </ul>
        <p>
          Untuk menggunakan hak-hak ini, silakan hubungi kami melalui halaman{" "}
          <Link href="/contact" className={linkClass}>
            Kontak
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection title="8. Data Anak-Anak">
        <p>
          Layanan Malanghub tidak ditujukan bagi anak-anak di bawah usia 13
          tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari
          anak-anak.
        </p>
      </LegalSection>
      <LegalSection title="9. Perubahan Kebijakan Privasi">
        <p>
          Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan
          akan diberitahukan melalui halaman ini dengan memperbarui tanggal di
          bagian atas. Penggunaan layanan secara berkelanjutan setelah perubahan
          berarti Anda menerima kebijakan yang baru.
        </p>
      </LegalSection>
      <LegalSection title="10. Hubungi Kami">
        <p>
          Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan
          hubungi kami melalui halaman{" "}
          <Link href="/contact" className={linkClass}>
            Kontak
          </Link>
          .
        </p>
      </LegalSection>
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
      <PageBreadcrumbs
        items={[
          { label: "Dashboard", href: "/users" },
          { label: "Tulis Draft" },
        ]}
      />
      <PageSection>
        <SectionTitle as="h1">Tulis Draft</SectionTitle>
        <Card className="max-w-3xl p-6">
          <form onSubmit={submit}>
            <Input
              label="Judul"
              value={form.title}
              placeholder="Judul"
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <Input
              label="Slug"
              value={createSlug(form.title)}
              placeholder="Slug"
              readOnly
            />
            <Select
              label="Kategori"
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
            </Select>
            <Select
              label="Tag"
              multiple
              className="min-h-32"
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
            </Select>
            <Textarea
              label="Konten"
              rows={12}
              value={form.content}
              placeholder="Konten berita"
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
            />
            <Button type="submit">Simpan Draft</Button>
          </form>
        </Card>
      </PageSection>
    </>
  );
};
