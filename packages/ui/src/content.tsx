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
  "font-semibold text-brand no-underline hover:text-brand-hover hover:underline";

/** Typography for rich HTML (articles, drafts) coming from TinyMCE. */
export const richContentClass = cx(
  "break-words font-sans text-body",
  "[&_p]:mb-4 [&_p]:text-[1.0625rem] [&_p]:leading-8 [&_p]:text-body",
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold",
  "[&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold",
  "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold",
  "[&_a]:font-semibold [&_a]:text-brand [&_a]:underline",
  "[&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_li]:mb-1 [&_li]:leading-7",
  "[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted",
  "[&_iframe]:max-w-full [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:p-2",
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
  <section className={cx("py-8 sm:py-12", className)}>
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
      "mb-6 flex items-center gap-3 font-heading text-2xl font-bold leading-tight text-fg",
      "before:block before:h-6 before:w-1.5 before:shrink-0 before:rounded-full before:bg-brand before:content-['']",
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
      "grid gap-10 lg:gap-12",
      wideMain ? "lg:grid-cols-4" : "lg:grid-cols-3",
    )}
  >
    <div
      className={cx(
        "min-w-0",
        wideMain ? "lg:col-span-3" : "lg:col-span-2",
      )}
    >
      {main}
    </div>
    <aside className="min-w-0">
      <div className="lg:sticky lg:top-24">{aside}</div>
    </aside>
  </div>
);

export const LoadingState = () => <LoadingBlock label="Memuat..." />;

export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div
    role="status"
    className={cx(
      cardClass,
      "flex min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center font-heading text-xl font-semibold text-fg",
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
        "relative block shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line",
        className,
      )}
    >
      <Image
        src={src || DEFAULT_AVATAR_SRC}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
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
  "inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-body no-underline transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

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
        "m-0 flex flex-wrap gap-2 p-0 list-none",
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
  <section className="border-b border-line bg-surface">
    <Container className="flex flex-col-reverse gap-8 py-10 sm:py-14 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        {user?.motto && (
          <span className={badgeClass("brand", "mb-3")}>{user.motto}</span>
        )}
        <h1 className="m-0 font-heading text-3xl font-bold leading-tight text-fg sm:text-4xl">
          {greeting && "Halo, "}
          <span className="text-brand">{user?.name}</span>
        </h1>
        {user?.bio && (
          <div
            className="mt-4 max-w-2xl text-body [&_p]:text-body"
            dangerouslySetInnerHTML={{ __html: user.bio }}
          />
        )}
        <SocialLinks user={user} className="mt-5" />
        {actions && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      <Avatar
        src={user?.photo}
        alt={user?.name ?? "Profil"}
        className="size-28 ring-4 ring-brand-soft sm:size-36 md:size-44"
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
            <header className="mb-8">
              <Link
                href={getCategoryHref(news)}
                className={badgeClass("brand", "mb-4 hover:opacity-80")}
              >
                {getCategoryName(news)}
              </Link>
              <h1 className="m-0 font-heading text-3xl font-bold leading-tight text-fg sm:text-4xl">
                {news.title}
              </h1>
              <div className="mt-5 flex items-center gap-3">
                <Link href={getAuthorHref(news)} className="shrink-0">
                  <Avatar
                    src={news.user?.photo}
                    alt={authorName}
                    className="size-11"
                  />
                </Link>
                <div className="min-w-0 text-sm">
                  <div className="text-body">
                    <Link href={getAuthorHref(news)} className={linkClass}>
                      {authorName}
                    </Link>{" "}
                    di{" "}
                    <Link href={getCategoryHref(news)} className={linkClass}>
                      {getCategoryName(news)}
                    </Link>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-muted">
                    <span>{formatDateTime(news.created_at)}</span>
                    <span aria-hidden>•</span>
                    <span>{readingTime(news)}</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-xl bg-surface-2 shadow-card">
              <Image
                src={news.mainImage || "/malanghub-meta.png"}
                alt={news.title}
                className="absolute inset-0 size-full object-cover"
                objectFit="cover"
                fill
              />
            </div>

            <div className={richContentClass}>{content}</div>

            <div className="mt-10 flex flex-col gap-6 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 mr-1 text-sm font-bold text-fg">
                  {tagsLabel}
                </h2>
                {tags.map((tag) => (
                  <Link
                    key={tag._id ?? tag.slug}
                    href={`/newsTags/${tag.slug}`}
                    className={badgeClass(
                      "neutral",
                      "px-3 py-1 text-sm hover:bg-brand-soft hover:text-brand",
                    )}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="m-0 mr-1 text-sm font-bold text-fg">
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
                "mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center",
              )}
            >
              <Avatar
                src={news.user?.photo}
                alt={authorName}
                className="size-20 sm:size-24"
              />
              <div className="min-w-0">
                <h2 className="m-0 font-heading text-xl font-bold text-fg">
                  {authorName}
                </h2>
                {news.user?.bio && (
                  <p className="mt-2 text-body">{news.user.bio}</p>
                )}
                <SocialLinks user={news.user} className="mt-4" />
              </div>
            </div>

            {footer}
          </article>
        }
        aside={
          <>
            <SectionTitle as="h2" className="text-xl">
              {asideTitle}
            </SectionTitle>
            {aside}
          </>
        }
      />
    </PageSection>
  );
};
