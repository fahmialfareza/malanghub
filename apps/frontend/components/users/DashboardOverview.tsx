import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { connect } from "react-redux";
import parse from "html-react-parser";
import { Badge, Button, Card, Spinner, buttonClass } from "@malanghub/ui";
import assetsPath from "../layouts/Assets";
import EditProfileModal from "./EditProfileModal";
import AddNews from "./news/AddNews";
import StatTile from "./news/StatTile";
import { isAdminRole } from "./DashboardLayout";
import { getMyNews } from "../../redux/actions/newsActions";
import {
  getAllNewsDrafts,
  getMyNewsDrafts,
} from "../../redux/actions/newsDraftActions";
import { getNewsCategories } from "../../redux/actions/newsCategoryActions";
import { getNewsTags } from "../../redux/actions/newsTagActions";
import { RootState } from "../../redux/store";
import {
  NewsCategoryReducerState,
  NewsDraftReducerState,
  NewsReducerState,
  NewsTagReducerState,
  UserReducerState,
} from "../../redux/types";

interface DashboardOverviewProps {
  user: UserReducerState;
  news: NewsReducerState;
  newsDraft: NewsDraftReducerState;
  newsCategory: NewsCategoryReducerState;
  newsTag: NewsTagReducerState;
  getMyNews: () => void;
  getMyNewsDrafts: () => void;
  getAllNewsDrafts: () => void;
  getNewsCategories: () => void;
  getNewsTags: () => void;
}

type Stat = {
  href: string;
  label: string;
  icon: string;
  value: ReactNode;
};

const count = (loading: boolean, items?: unknown[] | null) =>
  loading ? <Spinner /> : (items?.length ?? 0);

/** Profile card, per-section counts and quick actions for /users. */
const DashboardOverview = ({
  user: { user },
  news: { myNews, loading: newsLoading },
  newsDraft: { myNewsDrafts, allNewsDrafts, loading: newsDraftLoading },
  newsCategory: { newsCategories, loading: newsCategoryLoading },
  newsTag: { newsTags, loading: newsTagLoading },
  getMyNews,
  getMyNewsDrafts,
  getAllNewsDrafts,
  getNewsCategories,
  getNewsTags,
}: DashboardOverviewProps) => {
  const [modal, setModal] = useState<"profile" | "addNews" | null>(null);
  const closeModal = () => setModal(null);
  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    getMyNews();
    getMyNewsDrafts();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    getAllNewsDrafts();
    getNewsCategories();
    getNewsTags();
  }, [isAdmin]);

  const socialLinks = user
    ? [
        user.facebook && {
          key: "facebook",
          label: "Facebook",
          icon: "fab fa-facebook",
          href: user.facebook,
        },
        user.twitter && {
          key: "twitter",
          label: "Twitter",
          icon: "fab fa-twitter",
          href: `https://twitter.com/${user.twitter}`,
        },
        user.instagram && {
          key: "instagram",
          label: "Instagram",
          icon: "fab fa-instagram",
          href: `https://instagram.com/${user.instagram}`,
        },
        user.linkedin && {
          key: "linkedin",
          label: "Linkedin",
          icon: "fab fa-linkedin",
          href: user.linkedin,
        },
        user.tiktok && {
          key: "tiktok",
          label: "Tiktok",
          icon: "fab fa-tiktok",
          href: `https://www.tiktok.com/@${user.tiktok}`,
        },
      ].filter(
        (
          link,
        ): link is { key: string; label: string; icon: string; href: string } =>
          !!link,
      )
    : [];

  const stats: Stat[] = [
    {
      href: "/users/news",
      label: "Berita",
      icon: "fa fa-newspaper-o",
      value: count(newsLoading, myNews),
    },
    {
      href: "/users/news/drafts",
      label: "Antrian Berita",
      icon: "fa fa-clock-o",
      value: count(newsDraftLoading, myNewsDrafts),
    },
    ...(isAdmin
      ? [
          {
            href: "/users/news/agreements",
            label: "Persetujuan Berita",
            icon: "fa fa-check-square-o",
            value: count(newsDraftLoading, allNewsDrafts),
          },
          {
            href: "/users/categories",
            label: "Kategori",
            icon: "fa fa-list-alt",
            value: count(newsCategoryLoading, newsCategories),
          },
          {
            href: "/users/tags",
            label: "Tag",
            icon: "fa fa-tag",
            value: count(newsTagLoading, newsTags),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
          <div className="relative size-32 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface-2 shadow-card ring-1 ring-line sm:size-40">
            <Image
              src={
                user && user.photo
                  ? user.photo
                  : assetsPath("images/author.jpg")
              }
              alt={user?.name ? `Foto profil ${user.name}` : ""}
              className="object-cover"
              sizes="160px"
              fill
            />
          </div>
          <div className="min-w-0 flex-1">
            {user && user.motto && <Badge className="mb-3">{user.motto}</Badge>}
            <h2 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
              Halo, <span className="text-brand">{user && user.name}</span>
            </h2>
            {user && user.bio && (
              <div className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-body [&_p]:mb-2 [&_p]:text-body">
                {parse(user.bio)}
              </div>
            )}
            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row md:justify-between">
              {socialLinks.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
                  {socialLinks.map((link) => (
                    <li key={link.key}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={link.href}
                        aria-label={link.label}
                        className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 font-normal text-body no-underline transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                      >
                        <span className={link.icon} aria-hidden="true"></span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span />
              )}
              <Button onClick={() => setModal("profile")}>
                <i className="fa fa-edit" aria-hidden="true"></i> Edit Profil
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-heading text-lg font-semibold text-fg">
          Ringkasan
        </h2>
        <Button size="sm" onClick={() => setModal("addNews")}>
          <i className="fa fa-plus" aria-hidden="true"></i> Tambah Berita
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatTile
            key={stat.href}
            label={stat.label}
            icon={stat.icon}
            value={stat.value}
            action={
              <Link
                href={stat.href}
                aria-label={`Lihat ${stat.label}`}
                className={buttonClass({
                  variant: "ghost",
                  size: "sm",
                  className: "-ml-3 self-start text-brand",
                })}
              >
                Lihat <i className="fa fa-angle-right" aria-hidden="true"></i>
              </Link>
            }
          />
        ))}
      </div>

      <EditProfileModal open={modal === "profile"} onClose={closeModal} />

      <AddNews open={modal === "addNews"} onClose={closeModal} />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
  news: state.news,
  newsDraft: state.newsDraft,
  // The reducer return type is wider than its declared state shape.
  newsCategory: state.newsCategory as NewsCategoryReducerState,
  newsTag: state.newsTag,
});

export default connect(mapStateToProps, {
  getMyNews,
  getMyNewsDrafts,
  getAllNewsDrafts,
  getNewsCategories,
  getNewsTags,
})(DashboardOverview);
