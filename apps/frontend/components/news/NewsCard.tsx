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
        cx(
          "tw:transition-colors tw:hover:bg-brand tw:hover:text-brand-fg",
          className,
        ),
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
      "tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-[0.8rem] tw:text-muted",
      className,
    )}
  >
    {news.user && news.user._id ? (
      <Link
        href={`/users/${news.user._id}`}
        className="tw:font-semibold tw:text-body tw:no-underline tw:hover:text-brand"
      >
        {news.user.name ?? "Penulis"}
      </Link>
    ) : (
      <span className="tw:font-semibold tw:text-body">
        {news.user?.name ?? "Penulis"}
      </span>
    )}
    <span aria-hidden className="tw:text-line-strong">
      &middot;
    </span>
    <Moment format={dateFormat}>{news.created_at}</Moment>
    <span aria-hidden className="tw:text-line-strong">
      &middot;
    </span>
    <span className="tw:inline-flex tw:items-center tw:gap-1">
      <span className="fa fa-clock-o" aria-hidden="true"></span>
      {readMinutes(news)} menit
    </span>
  </div>
);

const imageLinkClass =
  "tw:group/img tw:relative tw:block tw:overflow-hidden tw:rounded-xl tw:bg-surface-2";
const imageClass =
  "tw:object-cover tw:transition-transform tw:duration-500 tw:group-hover/img:scale-105";
const titleLinkClass =
  "tw:font-heading tw:font-bold tw:text-fg tw:no-underline tw:transition-colors tw:hover:text-brand";

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
      <article className={cx("tw:flex tw:gap-4", className)}>
        <Link
          href={href}
          className={cx(
            imageLinkClass,
            "tw:aspect-square tw:w-24 tw:shrink-0 tw:sm:w-28",
          )}
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
        <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5">
          <CategoryBadge news={news} className="tw:self-start" />
          <Heading className="tw:m-0 tw:text-base tw:leading-snug tw:line-clamp-2">
            <Link href={href} className={titleLinkClass}>
              {news.title}
            </Link>
          </Heading>
          <NewsMeta news={news} className="tw:text-xs" />
        </div>
      </article>
    );
  }

  const featured = variant === "featured";

  return (
    <article className={cx("tw:group tw:flex tw:flex-col tw:gap-4", className)}>
      <Link
        href={href}
        className={cx(
          imageLinkClass,
          featured ? "tw:aspect-video tw:shadow-card" : "tw:aspect-[16/10]",
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
      <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-2.5">
        <CategoryBadge news={news} className="tw:self-start" />
        <Heading
          className={cx(
            "tw:m-0 tw:leading-tight",
            featured
              ? "tw:text-2xl tw:md:text-[1.75rem] tw:lg:text-3xl"
              : "tw:text-lg tw:line-clamp-3",
          )}
        >
          <Link href={href} className={titleLinkClass}>
            {news.title}
          </Link>
        </Heading>
        {(showExcerpt ?? featured) && (
          <p
            className={cx(
              "tw:m-0 tw:text-[0.95rem] tw:leading-relaxed tw:text-body",
              featured ? "tw:line-clamp-3" : "tw:line-clamp-2",
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
  <article className="tw:flex tw:gap-4">
    <span
      aria-hidden
      className="tw:w-8 tw:shrink-0 tw:font-heading tw:text-3xl tw:font-bold tw:leading-none tw:text-brand/40"
    >
      {index + 1}
    </span>
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5">
      <h3 className="tw:m-0 tw:text-[0.95rem] tw:leading-snug">
        <Link href={`/news/${news.slug}`} className={titleLinkClass}>
          {news.title}
        </Link>
      </h3>
      <NewsMeta news={news} className="tw:text-xs" dateFormat="Do MMMM YYYY" />
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
        <div className="tw:mt-10 tw:grid tw:gap-x-6 tw:gap-y-10 tw:border-t tw:border-line tw:pt-10 tw:sm:grid-cols-2">
          {rest.map((item) => (
            <NewsCard key={item._id} news={item} showExcerpt />
          ))}
        </div>
      )}
      <NewsPagination meta={news.meta} onPageChange={onPageChange} />
    </div>
  );
};
