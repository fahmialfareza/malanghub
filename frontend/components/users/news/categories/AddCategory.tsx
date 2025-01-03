import { FormEvent, useState } from "react";
import { connect } from "react-redux";
import { createNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import { LayoutReducerState } from "../../../../redux/types";
import { CreateUpdateNewsCategory } from "../../../../redux/actions/types/newsCategory";

interface AddCategoryProps {
  layout: LayoutReducerState;
  createNewsCategory: (formData: CreateUpdateNewsCategory) => void;
  setAlert: (message: string, type: string) => void;
}

const AddCategory = ({
  layout: { theme },
  createNewsCategory,
}: AddCategoryProps) => {
  const [name, setName] = useState("");

  const hideModal = () => {
    // @ts-ignore
    window.$("#addNewsCategoryModal").modal("toggle");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    createNewsCategory({
      name,
    });

    setName("");

    hideModal();
  };

  return (
    <>
      <div className="modal fade" id="addNewsCategoryModal">
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
                Tambah Kategori (Berita)
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-addNewsCategoryModal">
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
                form="form-addNewsCategoryModal"
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
  layout: state.layout,
});

export default connect(mapStateToProps, {
  createNewsCategory,
  setAlert,
})(AddCategory);
