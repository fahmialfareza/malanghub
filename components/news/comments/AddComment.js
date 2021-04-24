import { useState } from "react";
import { connect } from "react-redux";
import { setAlert } from "../../../redux/actions/layoutActions";
import { createCommentByComment } from "../../../redux/actions/newsCommentActions";
import Alert from "../../layouts/Alert";

const AddComment = ({
  layout: { theme },
  newsComment: { currentComment, error },
  createCommentByComment,
}) => {
  const [comment, setComment] = useState("");

  const hideModal = () => {
    window.$("#addCommentModal").modal("toggle");
  };

  const onSubmit = (event) => {
    event.preventDefault();

    createCommentByComment(currentComment._id, comment);

    if (error) {
      setAlert(error, "danger");
    } else {
      setComment("");

      hideModal();
    }
  };

  return (
    <div className="modal fade" id="addCommentModal">
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
              Balas Komentar {currentComment && currentComment.user.name}
            </h5>
            <button className="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <Alert />
            <form id="form-addCommentModal" onSubmit={onSubmit}>
              <div className="form-group">
                <textarea
                  name="Comment"
                  className="form-control"
                  placeholder="Komentarmu *"
                  required=""
                  spellCheck="false"
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
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
              form="form-addCommentModal"
              value="Submit"
              className="btn btn-primary"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  layout: state.layout,
  newsComment: state.newsComment,
});

export default connect(mapStateToProps, { createCommentByComment })(AddComment);
