import { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  LoadingBlock,
  Table,
} from "@malanghub/ui";
import { getNewsTags } from "../../../../redux/actions/newsTagActions";
import TagTableItem from "./TagTableItem";
import AddTag from "./AddTag";
import EditTag from "./EditTag";
import DeleteTag from "./DeleteTag";
import { RootState } from "../../../../redux/store";
import { NewsTagReducerState } from "../../../../redux/types";

interface TagsProps {
  newsTag: NewsTagReducerState;
  getNewsTags: () => void;
}

type TagModal = "add" | "edit" | "delete" | null;

const Tags = ({
  newsTag: { newsTags, loading: newsTagLoading },
  getNewsTags,
}: TagsProps) => {
  const [modal, setModal] = useState<TagModal>(null);
  const closeModal = () => setModal(null);

  useEffect(() => {
    getNewsTags();
  }, []);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Tag (Berita)
              {!newsTagLoading && (
                <Badge tone="neutral">{newsTags?.length ?? 0}</Badge>
              )}
            </span>
          }
          actions={
            <Button size="sm" onClick={() => setModal("add")}>
              <i className="fa fa-plus" aria-hidden="true"></i> Tambah Tag
            </Button>
          }
        />
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Tag</th>
              <th>Dibuat</th>
              <th>Diperbaharui</th>
              <th>
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {newsTagLoading ? (
              <tr>
                <td colSpan={5}>
                  <LoadingBlock />
                </td>
              </tr>
            ) : newsTags && newsTags.length > 0 ? (
              newsTags.map((tag, index) => (
                <TagTableItem
                  key={tag.id ?? tag._id}
                  tag={tag}
                  index={index}
                  onEdit={() => setModal("edit")}
                  onDelete={() => setModal("delete")}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-10! text-center text-muted">
                  Belum ada tag.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <AddTag open={modal === "add"} onClose={closeModal} />

      <EditTag open={modal === "edit"} onClose={closeModal} />

      <DeleteTag open={modal === "delete"} onClose={closeModal} />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsTag: state.newsTag,
});

// @ts-ignore
export default connect(mapStateToProps, { getNewsTags })(Tags);
