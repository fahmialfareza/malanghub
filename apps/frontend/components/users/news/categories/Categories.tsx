import { useEffect } from "react";
import { connect } from "react-redux";
import { getNewsCategories } from "../../../../redux/actions/newsCategoryActions";
import CategoryTableItem from "./CategoryTableItem";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";
import Spinner from "../../../layouts/Spinner";
import { RootState } from "../../../../redux/store";
import {
  LayoutReducerState,
  NewsCategoryReducerState,
} from "../../../../redux/types";

interface CategoriesProps {
  newsCategory: NewsCategoryReducerState;
  layout: LayoutReducerState;
  getNewsCategories: () => void;
}

const Categories = ({
  newsCategory: { newsCategories, loading: newsCategoryLoading },
  layout: { theme },
  getNewsCategories,
}: CategoriesProps) => {
  useEffect(() => {
    getNewsCategories();
  }, []);

  return (
    <>
      <section id="category" className="collapse show mb-5">
        <section id="actions" className="py-4 mb-1">
          <div className="container">
            <div className="row">
              <div className="col-md-3">
                <a
                  href="#"
                  className="btn btn-primary btn-block"
                  data-toggle="modal"
                  data-target="#addNewsCategoryModal"
                >
                  <i className="fa fa-plus" aria-hidden="true"></i> Tambah
                  Kategori
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <div className="row">
            <div className="col-md-9 mb-2">
              <div className={theme === "dark" ? "card bg-dark" : "card"}>
                <div
                  className={
                    theme === "dark" ? "card-header text-light" : "card-header"
                  }
                >
                  <h4>Kategori (Berita)</h4>
                </div>
                <div className="table-responsive">
                  <table
                    className={
                      theme === "dark"
                        ? "table table-striped table-dark"
                        : "table table-striped"
                    }
                  >
                    <thead
                      className={
                        theme === "dark" ? "thead-dark" : "thead-light"
                      }
                    >
                      <tr>
                        <th>ID</th>
                        <th>Nama Kategori</th>
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsCategoryLoading ? (
                        <Spinner />
                      ) : (
                        newsCategories &&
                        newsCategories.map((category, index) => (
                          <CategoryTableItem
                            key={category._id}
                            category={category}
                            index={index}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center bg-primary text-light mb-3">
                <div className="card-body">
                  <h3 style={{ color: "#f8f9fa" }}>Kategori</h3>
                  <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                    <i className="fa fa-pencil-alt" aria-hidden="true"></i>{" "}
                    {newsCategoryLoading ? (
                      <Spinner />
                    ) : newsCategories ? (
                      newsCategories.length
                    ) : (
                      0
                    )}
                  </h4>
                  <a
                    href="#"
                    className="port-item btn btn btn-outline-light btn-sm"
                    data-toggle="collapse"
                    data-target="#category"
                  >
                    Lihat
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddCategory />

      <EditCategory />

      <DeleteCategory />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
  layout: state.layout,
});

const mapActionToProps = { getNewsCategories };

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(Categories);
