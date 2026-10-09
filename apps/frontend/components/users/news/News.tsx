import { useState, useEffect, ReactNode } from "react";
import { connect } from "react-redux";
import {
  Button,
  Card,
  CardHeader,
  Container,
  LoadingBlock,
  Spinner,
  Table,
  cx,
} from "@malanghub/ui";
import AddNews from "./AddNews";
import EditNewsDraft from "./drafts/EditNewsDraft";
import DeleteNewsDraft from "./drafts/DeleteNewsDraft";
import AllNewsDraftTableItem from "./drafts/AllNewsDraftTableItem";
import NewsDraftTableItem from "./drafts/NewsDraftTableItem";
import NewsTableItem from "./NewsTableItem";
import EditNews from "./EditNews";
import StatTile from "./StatTile";
import {
  getAllNewsDrafts,
  getMyNewsDrafts,
} from "../../../redux/actions/newsDraftActions";
import { getMyNews } from "../../../redux/actions/newsActions";
import { RootState } from "../../../redux/store";
import {
  NewsDraftReducerState,
  NewsReducerState,
} from "../../../redux/types";
import { UserProfile } from "../../../models/user";

interface NewsProps {
  user: UserProfile;
  news: NewsReducerState;
  newsDraft: NewsDraftReducerState;
  getAllNewsDrafts: () => void;
  getMyNewsDrafts: () => void;
  getMyNews: () => void;
}

type TableName = "Berita" | "Antrian Berita" | "Persetujuan Berita";

type NewsModal = "add" | "editDraft" | "deleteDraft" | "approve" | null;

const News = ({
  user,
  news: { myNews, loading: newsLoading },
  newsDraft: { allNewsDrafts, myNewsDrafts, loading: newsDraftLoading },
  getAllNewsDrafts,
  getMyNewsDrafts,
  getMyNews,
}: NewsProps) => {
  const [tableName, setTableName] = useState<TableName>("Berita");
  const [modal, setModal] = useState<NewsModal>(null);
  const closeModal = () => setModal(null);

  const isAdmin = !!user?.role?.includes("admin");
  const showDraftColumns =
    tableName === "Antrian Berita" || tableName === "Persetujuan Berita";
  const columnCount = showDraftColumns ? 7 : 5;

  useEffect(() => {
    getMyNews();
    getAllNewsDrafts();
    getMyNewsDrafts();
  }, []);

  const tabs: { name: TableName; count: ReactNode; icon: string }[] = [
    {
      name: "Berita",
      icon: "fa fa-newspaper-o",
      count: newsLoading ? <Spinner /> : myNews ? myNews.length : 0,
    },
    {
      name: "Antrian Berita",
      icon: "fa fa-clock-o",
      count: newsDraftLoading ? (
        <Spinner />
      ) : myNewsDrafts ? (
        myNewsDrafts.length
      ) : (
        0
      ),
    },
    ...(isAdmin
      ? [
          {
            name: "Persetujuan Berita" as TableName,
            icon: "fa fa-check-square-o",
            count: newsDraftLoading ? (
              <Spinner />
            ) : allNewsDrafts ? (
              allNewsDrafts.length
            ) : (
              0
            ),
          },
        ]
      : []),
  ];

  const loading =
    (tableName === "Berita" && newsLoading) ||
    (tableName !== "Berita" && newsDraftLoading);

  const rows =
    tableName === "Berita"
      ? myNews?.map((news, index) => (
          <NewsTableItem key={news._id} news={news} index={index} />
        ))
      : tableName === "Antrian Berita"
        ? myNewsDrafts?.map((draft, index) => (
            <NewsDraftTableItem
              key={draft._id}
              draft={draft}
              index={index}
              onEdit={() => setModal("editDraft")}
              onDelete={() => setModal("deleteDraft")}
            />
          ))
        : allNewsDrafts?.map((draft, index) => (
            <AllNewsDraftTableItem
              key={draft._id}
              draft={draft}
              index={index}
              onEdit={() => setModal("approve")}
              onDelete={() => setModal("deleteDraft")}
            />
          ));

  return (
    <section id="news" className="tw:mb-12">
      <Container>
        <div
          role="group"
          aria-label="Pilih tabel berita"
          className="tw:mb-6 tw:flex tw:flex-wrap tw:gap-2"
        >
          {tabs.map((tab) => {
            const active = tableName === tab.name;
            return (
              <button
                key={tab.name}
                type="button"
                aria-pressed={active}
                onClick={() => setTableName(tab.name)}
                className={cx(
                  "tw:inline-flex tw:h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:px-4 tw:text-sm tw:font-semibold tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring",
                  active
                    ? "tw:border-brand tw:bg-brand-soft tw:text-brand"
                    : "tw:border-line tw:bg-surface tw:text-body tw:hover:bg-surface-2 tw:hover:text-fg"
                )}
              >
                <i className={tab.icon} aria-hidden="true"></i> {tab.name}
              </button>
            );
          })}
        </div>

        <div className="tw:grid tw:gap-6 tw:lg:grid-cols-4">
          <Card className="tw:overflow-hidden tw:lg:col-span-3">
            <CardHeader
              title={tableName}
              actions={
                <Button size="sm" onClick={() => setModal("add")}>
                  <i className="fa fa-plus" aria-hidden="true"></i> Tambah
                  Berita
                </Button>
              }
            />
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Judul</th>
                  {showDraftColumns && <th>Pesan Dari Admin</th>}
                  {showDraftColumns && <th>Status</th>}
                  <th>Dibuat</th>
                  <th>Diperbaharui</th>
                  <th>
                    <span className="tw:sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columnCount}>
                      <LoadingBlock />
                    </td>
                  </tr>
                ) : rows && rows.length > 0 ? (
                  rows
                ) : (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="tw:py-10! tw:text-center tw:text-muted"
                    >
                      Belum ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>

          <div className="tw:order-first tw:grid tw:grid-cols-2 tw:content-start tw:gap-4 tw:sm:grid-cols-3 tw:lg:order-none tw:lg:grid-cols-1">
            {tabs.map((tab) => (
              <StatTile
                key={tab.name}
                label={tab.name}
                icon={tab.icon}
                value={tab.count}
                active={tableName === tab.name}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="tw:-ml-3 tw:self-start tw:text-brand"
                    onClick={() => setTableName(tab.name)}
                  >
                    Lihat <i className="fa fa-angle-right" aria-hidden="true"></i>
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      </Container>

      <AddNews open={modal === "add"} onClose={closeModal} />

      <DeleteNewsDraft open={modal === "deleteDraft"} onClose={closeModal} />

      <EditNewsDraft open={modal === "editDraft"} onClose={closeModal} />

      <EditNews open={modal === "approve"} onClose={closeModal} />
    </section>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsDraft: state.newsDraft,
  news: state.news,
});

export default connect(mapStateToProps, {
  getAllNewsDrafts,
  getMyNewsDrafts,
  getMyNews,
})(News);
