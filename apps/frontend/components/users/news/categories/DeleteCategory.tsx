import { connect } from "react-redux";
import { deleteNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { RootState } from "../../../../redux/store";
import {
  LayoutReducerState,
  NewsCategoryReducerState,
} from "../../../../redux/types";
import { MouseEvent } from "react";

interface DeleteCategoryProps {
  newsCategory: NewsCategoryReducerState;
  layout: LayoutReducerState;
  deleteNewsCategory: (id: string) => void;
}

const DeleteCategory = ({
  newsCategory: { currentNewsCategory },
  layout: { theme },
  deleteNewsCategory,
}: DeleteCategoryProps) => {
  const hideModal = () => {
    // @ts-ignore
    window.$("#deleteNewsCategoryModal").modal("toggle");
  };

  const onDelete = (
    event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    event.preventDefault();

    if (currentNewsCategory) {
      deleteNewsCategory(currentNewsCategory._id);
    }

    hideModal();
  };

  return (
    <>
      <div className="modal fade" id="deleteNewsCategoryModal">
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
                Hapus Kategori (Berita)
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <h4>Apakah anda yakin ingin menghapus kategori?</h4>
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

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
  layout: state.layout,
});

const mapActionToProps = {
  deleteNewsCategory,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(DeleteCategory);
