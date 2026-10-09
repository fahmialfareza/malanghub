import { ReactNode, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Card,
  Container,
  LoadingBlock,
  cx,
} from "@malanghub/ui";
import { loadUser, logout } from "../../redux/actions/userActions";
import { setActiveLink } from "../../redux/actions/layoutActions";
import { RootState } from "../../redux/store";
import { UserReducerState } from "../../redux/types";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

export const dashboardNav: NavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ href: "/users", label: "Ringkasan", icon: "fa fa-th-large" }],
  },
  {
    label: "Berita",
    items: [
      { href: "/users/news", label: "Berita", icon: "fa fa-newspaper-o" },
      {
        href: "/users/news/drafts",
        label: "Antrian Berita",
        icon: "fa fa-clock-o",
      },
      {
        href: "/users/news/agreements",
        label: "Persetujuan Berita",
        icon: "fa fa-check-square-o",
        adminOnly: true,
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        href: "/users/categories",
        label: "Kategori",
        icon: "fa fa-list-alt",
        adminOnly: true,
      },
      { href: "/users/tags", label: "Tag", icon: "fa fa-tag", adminOnly: true },
    ],
  },
];

export const isAdminRole = (role?: string | null) => !!role?.includes("admin");

interface DashboardLayoutProps {
  /** Section label, used in the breadcrumb and <title>. Omit for the overview. */
  section?: string;
  /** Visible page heading. Defaults to `section` or "Dashboard". */
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Non-admins are redirected to /users. */
  adminOnly?: boolean;
  children: ReactNode;
  user: UserReducerState;
  loadUser: () => void;
  logout: () => void;
  setActiveLink: (link: string) => void;
}

const DashboardLayout = ({
  section,
  title,
  description,
  actions,
  adminOnly = false,
  children,
  user: { user, error },
  loadUser,
  logout,
  setActiveLink,
}: DashboardLayoutProps) => {
  const router = useRouter();
  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    setActiveLink("");
  }, []);

  // Guests go to /signin; a stored token loads the user if it isn't yet.
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("token");

    if (!token) {
      if (user) logout();
      router.replace("/signin");
      return;
    }

    if (!user) loadUser();
  }, [router.isReady]);

  // loadUser clears the token when it fails, so re-check after auth changes.
  useEffect(() => {
    if (!router.isReady || user) return;

    if (!localStorage.getItem("token")) {
      router.replace("/signin");
    }
  }, [router.isReady, user, error]);

  useEffect(() => {
    if (adminOnly && user && !isAdmin) {
      router.replace("/users");
    }
  }, [adminOnly, user, isAdmin]);

  const ready = !!user && (!adminOnly || isAdmin);
  const pageTitle = `Malanghub - Dashboard${section ? ` - ${section}` : ""}`;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Beranda", href: "/" },
    { label: "Dashboard", href: "/users" },
    ...(section ? [{ label: section }] : []),
  ];

  const groups = dashboardNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isAdmin || !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string) => router.pathname === href;

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
      </Head>

      <Breadcrumbs
        items={breadcrumbs}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />

      <section className="bg-bg py-8 sm:py-12">
        <Container>
          {!ready ? (
            <LoadingBlock label="Memuat dashboard" />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
              <aside className="hidden lg:block">
                <Card className="sticky top-24 p-3">
                  <nav aria-label="Navigasi dashboard">
                    {groups.map((group) => (
                      <div key={group.label} className="mb-3 last:mb-0">
                        <p className="m-0 px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                          {group.label}
                        </p>
                        <ul className="m-0 flex list-none flex-col gap-1 p-0">
                          {group.items.map((item) => {
                            const active = isActive(item.href);
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  aria-current={active ? "page" : undefined}
                                  className={cx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                                    active
                                      ? "bg-brand-soft text-brand"
                                      : "text-body hover:bg-surface-2 hover:text-fg",
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className="flex w-5 shrink-0 justify-center"
                                  >
                                    <i
                                      className={item.icon}
                                      aria-hidden="true"
                                    ></i>
                                  </span>
                                  {item.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </nav>
                </Card>
              </aside>

              <div className="min-w-0">
                <nav
                  aria-label="Navigasi dashboard"
                  className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden"
                >
                  <ul className="m-0 flex w-max list-none gap-2 p-0">
                    {groups
                      .flatMap((group) => group.items)
                      .map((item) => {
                        const active = isActive(item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cx(
                                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap no-underline transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                                active
                                  ? "border-brand bg-brand-soft text-brand"
                                  : "border-line bg-surface text-body hover:bg-surface-2 hover:text-fg",
                              )}
                            >
                              <span aria-hidden>
                                <i className={item.icon} aria-hidden="true"></i>
                              </span>
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </nav>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
                      {title ?? section ?? "Dashboard"}
                    </h1>
                    {description && (
                      <p className="mt-1 mb-0 text-sm text-muted">
                        {description}
                      </p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actions}
                    </div>
                  )}
                </div>

                {children}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, { loadUser, logout, setActiveLink })(
  DashboardLayout,
);
