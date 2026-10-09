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
    <section id="news" className="mb-12">
      <Container>
        <div
          role="group"
          aria-label="Pilih tabel berita"
          className="mb-6 flex flex-wrap gap-2"
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
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-surface text-body hover:bg-surface-2 hover:text-fg"
                )}
              >
                <i className={tab.icon} aria-hidden="true"></i> {tab.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
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
                    <span className="sr-only">Aksi</span>
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
                      className="py-10! text-center text-muted"
                    >
                      Belum ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>

          <div className="order-first grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                    className="-ml-3 self-start text-brand"
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
