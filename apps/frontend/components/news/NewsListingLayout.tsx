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
  <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
    <span className="mb-3 block text-3xl text-muted" aria-hidden="true">
      <span className="fa fa-newspaper-o" />
    </span>
    <p className="m-0 font-heading text-lg font-semibold text-fg">
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
      "m-0 mb-6 flex items-center gap-3 font-heading text-2xl font-bold text-fg",
      "before:block before:h-6 before:w-1.5 before:rounded-full before:bg-brand before:content-['']",
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
  <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
    <h2 className="m-0 mb-5 flex items-center gap-2 font-heading text-lg font-bold text-fg">
      <span
        className="fa fa-line-chart text-brand"
        aria-hidden="true"
      ></span>
      {title}
    </h2>
    {loading || news === null ? (
      <LoadingBlock />
    ) : news?.length > 0 ? (
      <ol className="m-0 flex list-none flex-col gap-5 p-0">
        {news.map((item, index) => (
          <li
            key={item._id}
            className={
              index > 0 ? "border-t border-line pt-5" : undefined
            }
          >
            <TrendingNews news={item} index={index} />
          </li>
        ))}
      </ol>
    ) : (
      <p className="m-0 text-sm text-muted">Belum Ada Berita</p>
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
    <Container className="py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-12">
        <main className="min-w-0 lg:col-span-8">
          <SectionTitle as="h1">{title}</SectionTitle>
          {children}
        </main>
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <TrendingPanel news={trendingNews} loading={trendingLoading} />
          </div>
        </aside>
      </div>
    </Container>
  </>
);

export default NewsListingLayout;
