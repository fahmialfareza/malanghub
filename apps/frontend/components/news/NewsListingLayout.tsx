import React from "react";
import Link from "next/link";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Container,
  LoadingBlock,
  cx,
} from "@malanghub/ui";
import { News } from "../../models/news";
import TrendingNews from "./TrendingNews";

export const renderNextLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

export const EmptyNews = ({ children }: { children: React.ReactNode }) => (
  <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-line-strong tw:bg-surface tw:px-6 tw:py-14 tw:text-center">
    <span
      className="fa fa-newspaper-o tw:mb-3 tw:block tw:text-3xl tw:text-muted"
      aria-hidden="true"
    ></span>
    <p className="tw:m-0 tw:font-heading tw:text-lg tw:font-semibold tw:text-fg">
      {children}
    </p>
  </div>
);

export const SectionTitle = ({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) => (
  <Tag
    className={cx(
      "tw:m-0 tw:mb-6 tw:flex tw:items-center tw:gap-3 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg",
      "tw:before:block tw:before:h-6 tw:before:w-1.5 tw:before:rounded-full tw:before:bg-brand tw:before:content-['']",
      className,
    )}
  >
    {children}
  </Tag>
);

export const TrendingPanel = ({
  news,
  loading,
  title = "Trending",
}: {
  news: News[] | null;
  loading?: boolean;
  title?: string;
}) => (
  <section className="tw:rounded-xl tw:border tw:border-line tw:bg-surface tw:p-5 tw:shadow-card">
    <h2 className="tw:m-0 tw:mb-5 tw:flex tw:items-center tw:gap-2 tw:font-heading tw:text-lg tw:font-bold tw:text-fg">
      <span
        className="fa fa-line-chart tw:text-brand"
        aria-hidden="true"
      ></span>
      {title}
    </h2>
    {loading || news === null ? (
      <LoadingBlock />
    ) : news?.length > 0 ? (
      <ol className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-5 tw:p-0">
        {news.map((item, index) => (
          <li
            key={item._id}
            className={
              index > 0 ? "tw:border-t tw:border-line tw:pt-5" : undefined
            }
          >
            <TrendingNews news={item} index={index} />
          </li>
        ))}
      </ol>
    ) : (
      <p className="tw:m-0 tw:text-sm tw:text-muted">Belum Ada Berita</p>
    )}
  </section>
);

/** Breadcrumbs + main column + sticky trending sidebar, shared by news listings. */
const NewsListingLayout = ({
  breadcrumbs,
  title,
  children,
  trendingNews,
  trendingLoading,
}: {
  breadcrumbs: BreadcrumbItem[];
  title: React.ReactNode;
  children: React.ReactNode;
  trendingNews: News[] | null;
  trendingLoading?: boolean;
}) => (
  <>
    <Breadcrumbs items={breadcrumbs} renderLink={renderNextLink} />
    <Container className="tw:py-10 tw:lg:py-14">
      <div className="tw:grid tw:gap-10 tw:lg:grid-cols-12">
        <main className="tw:min-w-0 tw:lg:col-span-8">
          <SectionTitle as="h1">{title}</SectionTitle>
          {children}
        </main>
        <aside className="tw:lg:col-span-4">
          <div className="tw:lg:sticky tw:lg:top-24">
            <TrendingPanel news={trendingNews} loading={trendingLoading} />
          </div>
        </aside>
      </div>
    </Container>
  </>
);

export default NewsListingLayout;
