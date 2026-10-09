import { connect } from "react-redux";
import { Button, Modal } from "@malanghub/ui";
import { deleteNewsDraft } from "../../../../redux/actions/newsDraftActions";
import { RootState } from "../../../../redux/store";
import { NewsDraftReducerState } from "../../../../redux/types";

interface DeleteNewsDraftProps {
  open: boolean;
  onClose: () => void;
  newsDraft: NewsDraftReducerState;
  deleteNewsDraft: (id: string) => void;
}

const DeleteNewsDraft = ({
  open,
  onClose,
  newsDraft: { currentNewsDraft },
  deleteNewsDraft,
}: DeleteNewsDraftProps) => {
  const onDelete = () => {
    if (currentNewsDraft) {
      deleteNewsDraft(currentNewsDraft.id || currentNewsDraft._id);
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hapus Berita"
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
        Apakah anda yakin ingin menghapus berita?
      </p>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsDraft: state.newsDraft,
});

export default connect(mapStateToProps, { deleteNewsDraft })(DeleteNewsDraft);
