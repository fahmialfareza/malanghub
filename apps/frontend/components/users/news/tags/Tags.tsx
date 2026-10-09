import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Button, Card, CardHeader, Container, Table } from "@malanghub/ui";
import { getNewsTags } from "../../../../redux/actions/newsTagActions";
import TagTableItem from "./TagTableItem";
import AddTag from "./AddTag";
import EditTag from "./EditTag";
import DeleteTag from "./DeleteTag";
import StatTile from "../StatTile";
import { RootState } from "../../../../redux/store";
import { NewsTagReducerState } from "../../../../redux/types";

interface TagsProps {
  newsTag: NewsTagReducerState;
  getNewsTags: () => void;
}

type TagModal = "add" | "edit" | "delete" | null;

const Tags = ({ newsTag: { newsTags }, getNewsTags }: TagsProps) => {
  const [modal, setModal] = useState<TagModal>(null);
  const closeModal = () => setModal(null);

  useEffect(() => {
    getNewsTags();
  }, []);

  return (
    <>
      <section id="tag" className="mb-12">
        <Container>
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="overflow-hidden lg:col-span-3">
              <CardHeader
                title="Tag (Berita)"
                actions={
                  <Button size="sm" onClick={() => setModal("add")}>
                    <i className="fa fa-plus" aria-hidden="true"></i> Tambah
                    Tag
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
                  {newsTags && newsTags.length > 0 ? (
                    newsTags.map((tag, index) => (
                      <TagTableItem
                        key={tag._id}
                        tag={tag}
                        index={index}
                        onEdit={() => setModal("edit")}
                        onDelete={() => setModal("delete")}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-10! text-center text-muted"
                      >
                        Belum ada tag.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
            <div className="order-first lg:order-none">
              <StatTile
                label="Tag"
                icon="fa fa-tag"
                value={newsTags ? newsTags.length : 0}
              />
            </div>
          </div>
        </Container>
      </section>

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
