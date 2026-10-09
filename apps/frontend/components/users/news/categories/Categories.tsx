import { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  Button,
  Card,
  CardHeader,
  Container,
  LoadingBlock,
  Spinner,
  Table,
} from "@malanghub/ui";
import { getNewsCategories } from "../../../../redux/actions/newsCategoryActions";
import CategoryTableItem from "./CategoryTableItem";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";
import StatTile from "../StatTile";
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
      <section id="category" className="tw:mb-12">
        <Container>
          <div className="tw:grid tw:gap-6 tw:lg:grid-cols-4">
            <Card className="tw:overflow-hidden tw:lg:col-span-3">
              <CardHeader
                title="Kategori (Berita)"
                actions={
                  <Button size="sm" onClick={() => setModal("add")}>
                    <i className="fa fa-plus" aria-hidden="true"></i> Tambah
                    Kategori
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
                      <span className="tw:sr-only">Aksi</span>
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
                        key={category._id}
                        category={category}
                        index={index}
                        onEdit={() => setModal("edit")}
                        onDelete={() => setModal("delete")}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={COLUMNS}
                        className="tw:py-10! tw:text-center tw:text-muted"
                      >
                        Belum ada kategori.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
            <div className="tw:order-first tw:lg:order-none">
              <StatTile
                label="Kategori"
                icon="fa fa-list-alt"
                value={
                  newsCategoryLoading ? (
                    <Spinner />
                  ) : newsCategories ? (
                    newsCategories.length
                  ) : (
                    0
                  )
                }
              />
            </div>
          </div>
        </Container>
      </section>

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
