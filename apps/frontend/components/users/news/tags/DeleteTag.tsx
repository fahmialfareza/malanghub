import { connect } from "react-redux";
import { Button, Modal } from "@malanghub/ui";
import { deleteNewsTag } from "../../../../redux/actions/newsTagActions";
import { RootState } from "../../../../redux/store";
import { NewsTagReducerState } from "../../../../redux/types";

interface DeleteTagProps {
  open: boolean;
  onClose: () => void;
  newsTag: NewsTagReducerState;
  deleteNewsTag: (id: string) => void;
}

const DeleteTag = ({
  open,
  onClose,
  newsTag: { currentNewsTag },
  deleteNewsTag,
}: DeleteTagProps) => {
  const onDelete = () => {
    if (currentNewsTag) {
      deleteNewsTag((currentNewsTag.id || currentNewsTag._id || "") as string);
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hapus Tag (Berita)"
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
        Apakah anda yakin ingin menghapus tag?
      </p>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsTag: state.newsTag,
});

// @ts-ignore
export default connect(mapStateToProps, { deleteNewsTag })(DeleteTag);
