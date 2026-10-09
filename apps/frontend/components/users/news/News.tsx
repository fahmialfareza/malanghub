import { useState, useEffect } from "react";
import { connect } from "react-redux";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  LoadingBlock,
  Table,
} from "@malanghub/ui";
import AddNews from "./AddNews";
import EditNewsDraft from "./drafts/EditNewsDraft";
import DeleteNewsDraft from "./drafts/DeleteNewsDraft";
import AllNewsDraftTableItem from "./drafts/AllNewsDraftTableItem";
import NewsDraftTableItem from "./drafts/NewsDraftTableItem";
import NewsTableItem from "./NewsTableItem";
import EditNews from "./EditNews";
import {
  getAllNewsDrafts,
  getMyNewsDrafts,
} from "../../../redux/actions/newsDraftActions";
import { getMyNews } from "../../../redux/actions/newsActions";
import { RootState } from "../../../redux/store";
import { NewsDraftReducerState, NewsReducerState } from "../../../redux/types";

/**
 * news: my published news, drafts: my news drafts,
 * agreements: every draft awaiting admin approval.
 */
export type NewsView = "news" | "drafts" | "agreements";

export const newsViewTitles: Record<NewsView, string> = {
  news: "Berita",
  drafts: "Antrian Berita",
  agreements: "Persetujuan Berita",
};

interface NewsProps {
  view: NewsView;
  news: NewsReducerState;
  newsDraft: NewsDraftReducerState;
  getAllNewsDrafts: () => void;
  getMyNewsDrafts: () => void;
  getMyNews: () => void;
}

type NewsModal = "add" | "editDraft" | "deleteDraft" | "approve" | null;

const News = ({
  view,
  news: { myNews, loading: newsLoading },
  newsDraft: { allNewsDrafts, myNewsDrafts, loading: newsDraftLoading },
  getAllNewsDrafts,
  getMyNewsDrafts,
  getMyNews,
}: NewsProps) => {
  const [modal, setModal] = useState<NewsModal>(null);
  const closeModal = () => setModal(null);

  const showDraftColumns = view !== "news";
  const columnCount = showDraftColumns ? 7 : 5;

  useEffect(() => {
    if (view === "news") getMyNews();
    else if (view === "drafts") getMyNewsDrafts();
    else getAllNewsDrafts();
  }, [view]);

  const loading = view === "news" ? newsLoading : newsDraftLoading;
  const items =
    view === "news" ? myNews : view === "drafts" ? myNewsDrafts : allNewsDrafts;

  const rows =
    view === "news"
      ? myNews?.map((news, index) => (
          <NewsTableItem key={news._id} news={news} index={index} />
        ))
      : view === "drafts"
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
    <>
      <Card className="overflow-hidden">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              {newsViewTitles[view]}
              {!loading && <Badge tone="neutral">{items?.length ?? 0}</Badge>}
            </span>
          }
          actions={
            view !== "agreements" && (
              <Button size="sm" onClick={() => setModal("add")}>
                <i className="fa fa-plus" aria-hidden="true"></i> Tambah Berita
              </Button>
            )
          }
        />
        <Table>
          <thead>
            <tr>
              <th className="hidden 2xl:table-cell">ID</th>
              <th>Judul</th>
              {showDraftColumns && <th>Pesan Dari Admin</th>}
              {showDraftColumns && <th>Status</th>}
              <th>Dibuat</th>
              <th className="hidden 2xl:table-cell">Diperbaharui</th>
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

      {view !== "agreements" && (
        <AddNews open={modal === "add"} onClose={closeModal} />
      )}

      {view !== "news" && (
        <DeleteNewsDraft open={modal === "deleteDraft"} onClose={closeModal} />
      )}

      {view === "drafts" && (
        <EditNewsDraft open={modal === "editDraft"} onClose={closeModal} />
      )}

      {view === "agreements" && (
        <EditNews open={modal === "approve"} onClose={closeModal} />
      )}
    </>
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
