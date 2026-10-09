import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { Button, Input, Modal } from "@malanghub/ui";
import { createNewsTag } from "../../../../redux/actions/newsTagActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import { NewsTagReducerState } from "../../../../redux/types";
import { CreateUpdateNewsTag } from "../../../../redux/actions/types/newsTag";

interface AddTagProps {
  open: boolean;
  onClose: () => void;
  newsTag: NewsTagReducerState;
  createNewsTag: (formData: CreateUpdateNewsTag) => void;
  setAlert: (message: string, type: string) => void;
}

const AddTag = ({
  open,
  onClose,
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

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    createNewsTag({
      name,
    });

    setName("");

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Tag (Berita)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-addNewsTagModal">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-addNewsTagModal">
        <Input
          label="Nama *"
          type="text"
          name="name"
          placeholder="Nama Tag"
          value={name}
          onChange={(event) => setName(event.target.value)}
          wrapperClassName="mb-0"
        />
      </form>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsTag: state.newsTag,
});

// @ts-ignore
export default connect(mapStateToProps, { createNewsTag, setAlert })(AddTag);
