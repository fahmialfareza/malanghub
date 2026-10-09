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
import { getNewsCategories } from "../../../../redux/actions/newsCategoryActions";
import CategoryTableItem from "./CategoryTableItem";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";
import { RootState } from "../../../../redux/store";
import { NewsCategoryReducerState } from "../../../../redux/types";

interface CategoriesProps {
  newsCategory: NewsCategoryReducerState;
  getNewsCategories: () => void;
}

type CategoryModal = "add" | "edit" | "delete" | null;

const COLUMNS = 5;

const Categories = ({
  newsCategory: { newsCategories, loading: newsCategoryLoading },
  getNewsCategories,
}: CategoriesProps) => {
  const [modal, setModal] = useState<CategoryModal>(null);
  const closeModal = () => setModal(null);

  useEffect(() => {
    getNewsCategories();
  }, []);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Kategori (Berita)
              {!newsCategoryLoading && (
                <Badge tone="neutral">{newsCategories?.length ?? 0}</Badge>
              )}
            </span>
          }
          actions={
            <Button size="sm" onClick={() => setModal("add")}>
              <i className="fa fa-plus" aria-hidden="true"></i> Tambah Kategori
            </Button>
          }
        />
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Kategori</th>
              <th>Dibuat</th>
              <th>Diperbaharui</th>
              <th>
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {newsCategoryLoading ? (
              <tr>
                <td colSpan={COLUMNS}>
                  <LoadingBlock />
                </td>
              </tr>
            ) : newsCategories && newsCategories.length > 0 ? (
              newsCategories.map((category, index) => (
                <CategoryTableItem
                  key={category.id ?? category._id}
                  category={category}
                  index={index}
                  onEdit={() => setModal("edit")}
                  onDelete={() => setModal("delete")}
                />
              ))
            ) : (
              <tr>
                <td colSpan={COLUMNS} className="py-10! text-center text-muted">
                  Belum ada kategori.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <AddCategory open={modal === "add"} onClose={closeModal} />

      <EditCategory open={modal === "edit"} onClose={closeModal} />

      <DeleteCategory open={modal === "delete"} onClose={closeModal} />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
});

const mapActionToProps = { getNewsCategories };

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(Categories);
