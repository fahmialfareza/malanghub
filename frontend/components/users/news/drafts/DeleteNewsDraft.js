import { connect } from "react-redux";
import { deleteNewsDraft } from "../../../../redux/actions/newsDraftActions";

const DeleteNewsDraft = ({
  newsDraft: { currentNewsDraft },
  layout: { theme },
  deleteNewsDraft,
}) => {
  const hideModal = () => {
    window.$("#deleteNewsDraftModal").modal("toggle");
  };

  const onDelete = (event) => {
    event.preventDefault();

    deleteNewsDraft(currentNewsDraft._id);

    hideModal();
  };

  return (
    <>
      <div className="modal fade" id="deleteNewsDraftModal">
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
                Hapus Berita
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <h4>Apakah anda yakin ingin menghapus berita?</h4>
            </div>
            <div className="modal-footer">
              <button
                value="Submit"
                className="btn btn-danger"
                onClick={onDelete}
              >
                Ya
              </button>
              <button className="btn btn-primary" data-dismiss="modal">
                Tidak
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  newsDraft: state.newsDraft,
  layout: state.layout,
});

export default connect(mapStateToProps, { deleteNewsDraft })(DeleteNewsDraft);
