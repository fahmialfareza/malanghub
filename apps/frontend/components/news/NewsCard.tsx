import Link from "next/link";
import Image from "next/image";
import Moment from "react-moment";
import "moment/locale/id";
import parse from "html-react-parser";
import ReactPaginate from "react-paginate";
import { badgeClass, cx, paginationClasses } from "@malanghub/ui";
import { News, NewsWithPagination } from "../../models/news";

/** Category name + slug, whether the API populated the category or not. */
export const newsCategoryOf = (news: News) => {
  const category = news.category;
  if (category && typeof category !== "string") {
    return {
      name: (category.name as string | undefined) ?? "Kategori",
      slug: category.slug as string | undefined,
    };
  }
  return {
    name: typeof category === "string" ? category : "Kategori",
    slug: undefined,
  };
};

export const readMinutes = (news: News) => Math.ceil(news.time_read / 10);

const stripHtml = (html?: string) => (html || "").replace(/<(.|\n)*?>/g, "");

export const CategoryBadge = ({
  news,
  className,
}: {
  news: News;
  className?: string;
}) => {
  const { name, slug } = newsCategoryOf(news);
  return slug ? (
    <Link
      href={`/newsCategories/${slug}`}
      className={badgeClass(
        "brand",
        cx("transition-colors hover:bg-brand hover:text-brand-fg", className),
      )}
    >
      {name}
    </Link>
  ) : (
    <span className={badgeClass("brand", className)}>{name}</span>
  );
};

/** "Author · date · N menit" row. */
export const NewsMeta = ({
  news,
  className,
  dateFormat = "dddd, Do MMMM YYYY",
}: {
  news: News;
  className?: string;
  dateFormat?: string;
}) => (
  <div
    className={cx(
      "flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-muted",
      className,
    )}
  >
    {/* Separators stay attached to the preceding item so a wrapped row never
        starts with a dangling dot. */}
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {news.user && news.user._id ? (
        <Link
          href={`/users/${news.user._id}`}
          className="font-semibold text-body no-underline hover:text-brand"
        >
          {news.user.name ?? "Penulis"}
        </Link>
      ) : (
        <span className="font-semibold text-body">
          {news.user?.name ?? "Penulis"}
        </span>
      )}
      <span aria-hidden className="text-line-strong">
        &middot;
      </span>
    </span>
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Moment format={dateFormat}>{news.created_at}</Moment>
      <span aria-hidden className="text-line-strong">
        &middot;
      </span>
    </span>
    <span className="inline-flex items-center gap-1">
      <span className="fa fa-clock-o" aria-hidden="true"></span>
      {readMinutes(news)} menit
    </span>
  </div>
);

const imageLinkClass =
  "group/img relative block overflow-hidden rounded-xl bg-surface-2";
const imageClass =
  "object-cover transition-transform duration-500 group-hover/img:scale-105";
const titleLinkClass =
  "font-heading font-bold text-fg no-underline transition-colors hover:text-brand";

export type NewsCardVariant = "featured" | "default" | "compact";

export const NewsCard = ({
  news,
  variant = "default",
  showExcerpt,
  priority,
  headingLevel = "h3",
  className,
}: {
  news: News;
  variant?: NewsCardVariant;
  showExcerpt?: boolean;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) => {
  const Heading = headingLevel;
  const href = `/news/${news.slug}`;

  if (variant === "compact") {
    return (
      <article className={cx("flex gap-4", className)}>
        <Link
          href={href}
          className={cx(imageLinkClass, "aspect-square w-24 shrink-0 sm:w-28")}
          aria-hidden
          tabIndex={-1}
        >
          <Image
            src={news.mainImage}
            alt={news.title}
            fill
            sizes="112px"
            className={imageClass}
          />
        </Link>
        <div className="flex min-w-0 flex-col gap-1.5">
          <CategoryBadge news={news} className="self-start" />
          <Heading className="m-0 text-base leading-snug line-clamp-2">
            <Link href={href} className={titleLinkClass}>
              {news.title}
            </Link>
          </Heading>
          <NewsMeta news={news} className="text-xs" />
        </div>
      </article>
    );
  }

  const featured = variant === "featured";

  return (
    <article className={cx("group flex flex-col gap-4", className)}>
      <Link
        href={href}
        className={cx(
          imageLinkClass,
          featured
            ? "aspect-video shadow-card lg:aspect-[2/1]"
            : "aspect-[16/10]",
        )}
        aria-hidden
        tabIndex={-1}
      >
        <Image
          src={news.mainImage}
          alt={news.title}
          fill
          priority={priority}
          sizes={
            featured
              ? "(min-width: 1024px) 760px, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          className={imageClass}
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-2.5">
        <CategoryBadge news={news} className="self-start" />
        <Heading
          className={cx(
            "m-0 leading-tight",
            featured
              ? "text-2xl md:text-[1.75rem] lg:text-3xl"
              : "text-lg line-clamp-3",
          )}
        >
          <Link href={href} className={titleLinkClass}>
            {news.title}
          </Link>
        </Heading>
        {(showExcerpt ?? featured) && (
          <p
            className={cx(
              "m-0 text-[0.95rem] leading-relaxed text-body",
              featured ? "line-clamp-3" : "line-clamp-2",
            )}
          >
            {parse(stripHtml(news.content))}
          </p>
        )}
        <NewsMeta news={news} />
      </div>
    </article>
  );
};

/** Numbered headline used in the trending sidebar. */
export const NumberedNewsItem = ({
  news,
  index,
}: {
  news: News;
  index: number;
}) => (
  <article className="flex gap-4">
    <span
      aria-hidden
      className="w-8 shrink-0 font-heading text-3xl font-bold leading-none text-brand/40"
    >
      {index + 1}
    </span>
    <div className="flex min-w-0 flex-col gap-1.5">
      <h3 className="m-0 text-[0.95rem] leading-snug">
        <Link href={`/news/${news.slug}`} className={titleLinkClass}>
          {news.title}
        </Link>
      </h3>
      <NewsMeta news={news} className="text-xs" dateFormat="Do MMMM YYYY" />
    </div>
  </article>
);

export const NewsPagination = ({
  meta,
  onPageChange,
}: {
  meta: NewsWithPagination["meta"];
  onPageChange: (page: number) => void;
}) =>
  meta ? (
    <nav aria-label="Navigasi halaman">
      <ReactPaginate
        {...paginationClasses}
        previousLabel={"<"}
        nextLabel={">"}
        breakLabel={"..."}
        initialPage={Math.max((meta.page || 1) - 1, 0)}
        pageCount={Math.max(
          Math.ceil((meta.total || 0) / (meta.limit || 1)),
          1,
        )}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={(data: { selected: number }) =>
          onPageChange(data.selected + 1)
        }
      />
    </nav>
  ) : null;

/** First story as a featured card, the rest in a responsive grid, then pagination. */
export const NewsGrid = ({
  news,
  onPageChange,
}: {
  news: NewsWithPagination;
  onPageChange: (page: number) => void;
}) => {
  const [first, ...rest] = news.data;
  return (
    <div>
      {first && (
        <NewsCard news={first} variant="featured" headingLevel="h2" priority />
      )}
      {rest.length > 0 && (
        <div className="mt-10 grid gap-x-6 gap-y-10 border-t border-line pt-10 sm:grid-cols-2">
          {rest.map((item) => (
            <NewsCard key={item._id} news={item} showExcerpt />
          ))}
        </div>
      )}
      <NewsPagination meta={news.meta} onPageChange={onPageChange} />
    </div>
  );
};
