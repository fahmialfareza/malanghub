import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { updateNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import {
  LayoutReducerState,
  NewsCategoryReducerState,
} from "../../../../redux/types";
import { CreateUpdateNewsCategory } from "../../../../redux/actions/types/newsCategory";

interface EditCategoryProps {
  newsCategory: NewsCategoryReducerState;
  layout: LayoutReducerState;
  updateNewsCategory: (formData: CreateUpdateNewsCategory, id: string) => void;
  setAlert: (message: string, type: string) => void;
}

const EditCategory = ({
  newsCategory: { currentNewsCategory, error },
  layout: { theme },
  updateNewsCategory,
  setAlert,
}: EditCategoryProps) => {
  const [name, setName] = useState(currentNewsCategory?.name);

  useEffect(() => {
    setName(currentNewsCategory?.name);
  }, [currentNewsCategory]);

  useEffect(() => {
    if (error) {
      setAlert(error, "danger");
    }
  }, [error]);

  const hideModal = () => {
    // @ts-ignore
    window.$("#editNewsCategoryModal").modal("toggle");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (name && currentNewsCategory) {
      updateNewsCategory(
        {
          name,
        },
        currentNewsCategory?._id
      );
    }

    setName("");

    hideModal();
  };

  return (
    <>
      <div className="modal fade" id="editNewsCategoryModal">
        <div className="modal-dialog modal-lg">
          <div
            className={
              theme === "dark"
                ? "modal-content bg-dark text-light"
                : "modal-content"
            }
          >
            <div className="modal-header bg-primary">
              <h5 className="modal-title" style={{ color: "#f8f9fa" }}>
                Edit Kategori (Berita)
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-editNewsCategoryModal">
                <div className="form-group">
                  <label htmlFor="name">Nama *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nama Kategori"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" data-dismiss="modal">
                Keluar
              </button>
              <button
                type="submit"
                form="form-editNewsCategoryModal"
                value="Submit"
                className="btn btn-primary"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
  layout: state.layout,
});

const mapActionToProps = {
  updateNewsCategory,
  setAlert,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(EditCategory);
