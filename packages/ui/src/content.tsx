/*
 * Internal presentational building blocks shared by pages.tsx and
 * dashboard.tsx. Not re-exported from the package index.
 */
import React from "react";
import type { News, User } from "@malanghub/core";
import { useAdapters } from "./adapters";
import {
  Breadcrumbs,
  type BreadcrumbItem,
  Container,
  LoadingBlock,
  badgeClass,
  cardClass,
  cx,
} from "./primitives";
import {
  getAuthorHref,
  getCategoryHref,
  getCategoryName,
  getSocialHref,
  readingTime,
} from "./utils";

export const DEFAULT_AVATAR_SRC = "/assets/images/author.jpg";

export const formatDateTime = (value?: string | Date) => {
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

export const getNewsTags = (news: News) =>
  (news.tags ?? []).filter(
    (tag): tag is Exclude<(typeof news.tags)[number], string> =>
      typeof tag !== "string",
  );

/** Text link look; set explicitly because legacy CSS styles bare `a`. */
export const linkClass =
  "tw:font-semibold tw:text-brand tw:no-underline tw:hover:text-brand-hover tw:hover:underline";

/** Typography for rich HTML (articles, drafts) coming from TinyMCE. */
export const richContentClass = cx(
  "tw:break-words tw:font-sans tw:text-body",
  "tw:[&_p]:mb-4 tw:[&_p]:text-[1.0625rem] tw:[&_p]:leading-8 tw:[&_p]:text-body",
  "tw:[&_h1]:mt-8 tw:[&_h1]:mb-3 tw:[&_h1]:text-3xl tw:[&_h1]:font-bold",
  "tw:[&_h2]:mt-8 tw:[&_h2]:mb-3 tw:[&_h2]:text-2xl tw:[&_h2]:font-bold",
  "tw:[&_h3]:mt-6 tw:[&_h3]:mb-3 tw:[&_h3]:text-xl tw:[&_h3]:font-bold",
  "tw:[&_h4]:mt-5 tw:[&_h4]:mb-2 tw:[&_h4]:text-lg tw:[&_h4]:font-semibold",
  "tw:[&_a]:font-semibold tw:[&_a]:text-brand tw:[&_a]:underline",
  "tw:[&_ul]:mb-4 tw:[&_ul]:pl-6 tw:[&_ol]:mb-4 tw:[&_ol]:pl-6 tw:[&_ul>li]:list-disc tw:[&_ol>li]:list-decimal tw:[&_li]:mb-1 tw:[&_li]:leading-7",
  "tw:[&_img]:my-4 tw:[&_img]:h-auto tw:[&_img]:max-w-full tw:[&_img]:rounded-xl",
  "tw:[&_blockquote]:my-6 tw:[&_blockquote]:border-l-4 tw:[&_blockquote]:border-brand tw:[&_blockquote]:pl-4 tw:[&_blockquote]:italic",
  "tw:[&_figcaption]:mt-2 tw:[&_figcaption]:text-center tw:[&_figcaption]:text-sm tw:[&_figcaption]:text-muted",
  "tw:[&_iframe]:max-w-full tw:[&_table]:w-full tw:[&_td]:border tw:[&_td]:border-line tw:[&_td]:p-2",
);

export const PageBreadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
  const { Link } = useAdapters();

  return (
    <Breadcrumbs
      items={items}
      renderLink={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  );
};

export const PageSection = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <section className={cx("tw:py-8 tw:sm:py-12", className)}>
    <Container>{children}</Container>
  </section>
);

export const SectionTitle = ({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) => (
  <Tag
    className={cx(
      "tw:mb-6 tw:flex tw:items-center tw:gap-3 tw:font-heading tw:text-2xl tw:font-bold tw:leading-tight tw:text-fg",
      "tw:before:block tw:before:h-6 tw:before:w-1.5 tw:before:shrink-0 tw:before:rounded-full tw:before:bg-brand tw:before:content-['']",
      className,
    )}
  >
    {children}
  </Tag>
);

/** Main column + sticky sidebar, stacked on small screens. */
export const TwoColumnLayout = ({
  main,
  aside,
  wideMain,
}: {
  main: React.ReactNode;
  aside: React.ReactNode;
  wideMain?: boolean;
}) => (
  <div
    className={cx(
      "tw:grid tw:gap-10 tw:lg:gap-12",
      wideMain ? "tw:lg:grid-cols-4" : "tw:lg:grid-cols-3",
    )}
  >
    <div
      className={cx(
        "tw:min-w-0",
        wideMain ? "tw:lg:col-span-3" : "tw:lg:col-span-2",
      )}
    >
      {main}
    </div>
    <aside className="tw:min-w-0">
      <div className="tw:lg:sticky tw:lg:top-24">{aside}</div>
    </aside>
  </div>
);

export const LoadingState = () => <LoadingBlock label="Memuat..." />;

export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div
    role="status"
    className={cx(
      cardClass,
      "tw:flex tw:min-h-40 tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:px-6 tw:py-10 tw:text-center tw:font-heading tw:text-xl tw:font-semibold tw:text-fg",
    )}
  >
    {children}
  </div>
);

export const Avatar = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const { Image } = useAdapters();

  return (
    <span
      className={cx(
        "tw:relative tw:block tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-surface-2 tw:ring-1 tw:ring-line",
        className,
      )}
    >
      <Image
        src={src || DEFAULT_AVATAR_SRC}
        alt={alt}
        className="tw:absolute tw:inset-0 tw:size-full tw:object-cover"
        objectFit="cover"
        fill
      />
    </span>
  );
};

type SocialPlatform = "facebook" | "twitter" | "instagram" | "linkedin" | "tiktok";

const SOCIALS: Array<{ platform: SocialPlatform; icon: string; label: string }> =
  [
    { platform: "facebook", icon: "fa-facebook", label: "Facebook" },
    { platform: "twitter", icon: "fa-twitter", label: "Twitter" },
    { platform: "instagram", icon: "fa-instagram", label: "Instagram" },
    { platform: "linkedin", icon: "fa-linkedin", label: "LinkedIn" },
    // Font Awesome 4 has no TikTok glyph.
    { platform: "tiktok", icon: "fa-music", label: "TikTok" },
  ];

export const iconButtonClass =
  "tw:inline-flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface tw:text-body tw:no-underline tw:transition-colors tw:hover:border-brand tw:hover:bg-brand-soft tw:hover:text-brand tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring";

export const SocialLinks = ({
  user,
  className,
}: {
  user?: Partial<Pick<User, SocialPlatform>> | null;
  className?: string;
}) => {
  const links = SOCIALS.filter(({ platform }) => user?.[platform]);
  if (!links.length) return null;

  return (
    <ul
      className={cx(
        "tw:m-0 tw:flex tw:flex-wrap tw:gap-2 tw:p-0 tw:list-none",
        className,
      )}
    >
      {links.map(({ platform, icon, label }) => (
        <li key={platform}>
          <a
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className={iconButtonClass}
            href={getSocialHref(platform, user?.[platform])}
          >
            <span className={`fa ${icon}`} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
};

/** Author/profile hero used on the dashboard and public profile pages. */
export const ProfileHeader = ({
  user,
  greeting,
  actions,
}: {
  user?: User;
  greeting?: boolean;
  actions?: React.ReactNode;
}) => (
  <section className="tw:border-b tw:border-line tw:bg-surface">
    <Container className="tw:flex tw:flex-col-reverse tw:gap-8 tw:py-10 tw:sm:py-14 tw:md:flex-row tw:md:items-center tw:md:justify-between">
      <div className="tw:min-w-0 tw:flex-1">
        {user?.motto && (
          <span className={badgeClass("brand", "tw:mb-3")}>{user.motto}</span>
        )}
        <h1 className="tw:m-0 tw:font-heading tw:text-3xl tw:font-bold tw:leading-tight tw:text-fg tw:sm:text-4xl">
          {greeting && "Halo, "}
          <span className="tw:text-brand">{user?.name}</span>
        </h1>
        {user?.bio && (
          <div
            className="tw:mt-4 tw:max-w-2xl tw:text-body tw:[&_p]:text-body"
            dangerouslySetInnerHTML={{ __html: user.bio }}
          />
        )}
        <SocialLinks user={user} className="tw:mt-5" />
        {actions && (
          <div className="tw:mt-6 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            {actions}
          </div>
        )}
      </div>
      <Avatar
        src={user?.photo}
        alt={user?.name ?? "Profil"}
        className="tw:size-28 tw:ring-4 tw:ring-brand-soft tw:sm:size-36 tw:md:size-44"
      />
    </Container>
  </section>
);

export type ShareLink = {
  icon: string;
  label: string;
  href: string;
  external?: boolean;
};

/** Full article layout shared by the news detail page and draft preview. */
export const ArticleView = ({
  news,
  content,
  tagsLabel,
  shareLabel,
  shareLinks,
  footer,
  asideTitle,
  aside,
}: {
  news: News;
  content: React.ReactNode;
  tagsLabel: string;
  shareLabel: string;
  shareLinks: ShareLink[];
  footer?: React.ReactNode;
  asideTitle: string;
  aside: React.ReactNode;
}) => {
  const { Link, Image } = useAdapters();
  const tags = getNewsTags(news);
  const authorName = news.user?.name ?? "Penulis";

  return (
    <PageSection>
      <TwoColumnLayout
        main={
          <article>
            <header className="tw:mb-8">
              <Link
                href={getCategoryHref(news)}
                className={badgeClass("brand", "tw:mb-4 tw:hover:opacity-80")}
              >
                {getCategoryName(news)}
              </Link>
              <h1 className="tw:m-0 tw:font-heading tw:text-3xl tw:font-bold tw:leading-tight tw:text-fg tw:sm:text-4xl">
                {news.title}
              </h1>
              <div className="tw:mt-5 tw:flex tw:items-center tw:gap-3">
                <Link href={getAuthorHref(news)} className="tw:shrink-0">
                  <Avatar
                    src={news.user?.photo}
                    alt={authorName}
                    className="tw:size-11"
                  />
                </Link>
                <div className="tw:min-w-0 tw:text-sm">
                  <div className="tw:text-body">
                    <Link href={getAuthorHref(news)} className={linkClass}>
                      {authorName}
                    </Link>{" "}
                    di{" "}
                    <Link href={getCategoryHref(news)} className={linkClass}>
                      {getCategoryName(news)}
                    </Link>
                  </div>
                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:gap-x-3 tw:text-muted">
                    <span>{formatDateTime(news.created_at)}</span>
                    <span aria-hidden>•</span>
                    <span>{readingTime(news)}</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="tw:relative tw:mb-8 tw:aspect-[4/3] tw:overflow-hidden tw:rounded-xl tw:bg-surface-2 tw:shadow-card">
              <Image
                src={news.mainImage || "/malanghub-meta.png"}
                alt={news.title}
                className="tw:absolute tw:inset-0 tw:size-full tw:object-cover"
                objectFit="cover"
                fill
              />
            </div>

            <div className={richContentClass}>{content}</div>

            <div className="tw:mt-10 tw:flex tw:flex-col tw:gap-6 tw:border-t tw:border-line tw:pt-6 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                <h2 className="tw:m-0 tw:mr-1 tw:text-sm tw:font-bold tw:text-fg">
                  {tagsLabel}
                </h2>
                {tags.map((tag) => (
                  <Link
                    key={tag._id ?? tag.slug}
                    href={`/newsTags/${tag.slug}`}
                    className={badgeClass(
                      "neutral",
                      "tw:px-3 tw:py-1 tw:text-sm tw:hover:bg-brand-soft tw:hover:text-brand",
                    )}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <h2 className="tw:m-0 tw:mr-1 tw:text-sm tw:font-bold tw:text-fg">
                  {shareLabel}
                </h2>
                {shareLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    aria-label={link.label}
                    title={link.label}
                    className={iconButtonClass}
                  >
                    <span className={`fa ${link.icon}`} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <div
              className={cx(
                cardClass,
                "tw:mt-10 tw:flex tw:flex-col tw:gap-5 tw:p-6 tw:sm:flex-row tw:sm:items-center",
              )}
            >
              <Avatar
                src={news.user?.photo}
                alt={authorName}
                className="tw:size-20 tw:sm:size-24"
              />
              <div className="tw:min-w-0">
                <h2 className="tw:m-0 tw:font-heading tw:text-xl tw:font-bold tw:text-fg">
                  {authorName}
                </h2>
                {news.user?.bio && (
                  <p className="tw:mt-2 tw:text-body">{news.user.bio}</p>
                )}
                <SocialLinks user={news.user} className="tw:mt-4" />
              </div>
            </div>

            {footer}
          </article>
        }
        aside={
          <>
            <SectionTitle as="h2" className="tw:text-xl">
              {asideTitle}
            </SectionTitle>
            {aside}
          </>
        }
      />
    </PageSection>
  );
};
