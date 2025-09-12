import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { createNewsTag } from "../../../../redux/actions/newsTagActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import {
  LayoutReducerState,
  NewsTagReducerState,
} from "../../../../redux/types";
import { CreateUpdateNewsTag } from "../../../../redux/actions/types/newsTag";

interface AddTagProps {
  layout: LayoutReducerState;
  newsTag: NewsTagReducerState;
  createNewsTag: (formData: CreateUpdateNewsTag) => void;
  setAlert: (message: string, type: string) => void;
}

const AddTag = ({
  layout: { theme },
  newsTag: { error },
  createNewsTag,
  setAlert,
}: AddTagProps) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (error) {
      setAlert(error, "danger");
    }
  }, [error]);

  const hideModal = () => {
    // @ts-ignore
    window.$("#addNewsTagModal").modal("toggle");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    createNewsTag({
      name,
    });

    setName("");

    hideModal();
  };

  return (
    <>
      <div className="modal fade" id="addNewsTagModal">
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
                Tambah Tag (Berita)
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-addNewsTagModal">
                <div className="form-group">
                  <label htmlFor="name">Nama *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nama Tag"
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
                form="form-addNewsTagModal"
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
  newsTag: state.newsTag,
});

// @ts-ignore
export default connect(mapStateToProps, { createNewsTag, setAlert })(AddTag);
