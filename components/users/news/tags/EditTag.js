import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateNewsTag } from "../../../../redux/actions/newsTagActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import Alert from "../../../layouts/Alert";

const EditTag = ({
  newsTag: { currentNewsTag, error },
  layout: { theme },
  updateNewsTag,
  setAlert,
}) => {
  const [name, setName] = useState(currentNewsTag.name);

  useEffect(() => {
    setName(currentNewsTag.name);
  }, [currentNewsTag]);

  const hideModal = () => {
    window.$("#editNewsTagModal").modal("toggle");
  };

  const onSubmit = (event) => {
    event.preventDefault();

    updateNewsTag(
      {
        name,
      },
      currentNewsTag._id
    );

    if (error) {
      setAlert(error, "danger");
    } else {
      setName("");

      hideModal();
    }
  };

  return (
    <>
      <div className="modal fade" id="editNewsTagModal">
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
                Edit Tag (Berita)
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <Alert />
              <form onSubmit={onSubmit} id="form-editNewsTagModal">
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
                form="form-editNewsTagModal"
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

const mapStateToProps = (state) => ({
  newsTag: state.newsTag,
  layout: state.layout,
});

export default connect(mapStateToProps, { updateNewsTag, setAlert })(EditTag);
