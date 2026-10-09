import { connect } from "react-redux";
import { Button, Modal } from "@malanghub/ui";
import { deleteNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { RootState } from "../../../../redux/store";
import { NewsCategoryReducerState } from "../../../../redux/types";

interface DeleteCategoryProps {
  open: boolean;
  onClose: () => void;
  newsCategory: NewsCategoryReducerState;
  deleteNewsCategory: (id: string) => void;
}

const DeleteCategory = ({
  open,
  onClose,
  newsCategory: { currentNewsCategory },
  deleteNewsCategory,
}: DeleteCategoryProps) => {
  const onDelete = () => {
    if (currentNewsCategory) {
      deleteNewsCategory(currentNewsCategory.id || currentNewsCategory._id);
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hapus Kategori (Berita)"
      size="sm"
      danger
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Tidak
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Ya
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:text-body">
        Apakah anda yakin ingin menghapus kategori?
      </p>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
});

const mapActionToProps = {
  deleteNewsCategory,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(DeleteCategory);
