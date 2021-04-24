import { useState } from "react";
import { connect } from "react-redux";
import { updateNewsDraftApproved } from "../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../redux/actions/layoutActions";
import Alert from "../../layouts/Alert";

const EditNews = ({
  layout: { theme },
  newsDraft: { currentNewsDraft, error },
  updateNewsDraftApproved,
  setAlert,
}) => {
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);

  const hideModal = () => {
    window.$("#editNewsModal").modal("toggle");
  };

  const handleApproved = (event) => {
    let trueFalse = event.target.checked;

    setApproved(trueFalse);
  };

  const onSubmit = (event) => {
    event.preventDefault();

    updateNewsDraftApproved(
      {
        message,
        approved,
      },
      currentNewsDraft._id
    );

    if (error) {
      setAlert(error, "danger");
    } else {
      document
        .querySelectorAll("input[type=checkbox]")
        .forEach((el) => (el.checked = false));

      setMessage("");

      hideModal();
    }
  };

  return (
    <>
      <div className="modal fade" id="editNewsModal">
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
                Persetujuan Berita
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <Alert />
              <form onSubmit={onSubmit} id="form-editNewsModal">
                <div className="form-group">
                  <label htmlFor="message">Pesan *</label>
                  <textarea
                    type="text"
                    name="message"
                    placeholder="Pesan"
                    className="form-control"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <h4>Persetujuan *</h4>
                  <div className="custom-control custom-switch custom-control-inline">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="approvement"
                      onChange={handleApproved}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="approvement"
                    >
                      Setuju
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" data-dismiss="modal">
                Keluar
              </button>
              <button
                type="submit"
                form="form-editNewsModal"
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
  layout: state.layout,
  newsDraft: state.newsDraft,
});

export default connect(mapStateToProps, { updateNewsDraftApproved, setAlert })(
  EditNews
);
