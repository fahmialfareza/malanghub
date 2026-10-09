import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { Button, Input, Modal } from "@malanghub/ui";
import { updateNewsTag } from "../../../../redux/actions/newsTagActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import { NewsTagReducerState } from "../../../../redux/types";
import { CreateUpdateNewsTag } from "../../../../redux/actions/types/newsTag";

interface EditTagProps {
  open: boolean;
  onClose: () => void;
  newsTag: NewsTagReducerState;
  updateNewsTag: (formData: CreateUpdateNewsTag, id: string) => void;
  setAlert: (message: string, type: string) => void;
}

const EditTag = ({
  open,
  onClose,
  newsTag: { currentNewsTag, error },
  updateNewsTag,
  setAlert,
}: EditTagProps) => {
  const [name, setName] = useState(currentNewsTag?.name);

  useEffect(() => {
    setName(currentNewsTag?.name);
  }, [currentNewsTag]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (name && currentNewsTag) {
      updateNewsTag(
        {
          name,
        },
        (currentNewsTag.id || currentNewsTag._id || "") as string
      );
    }

    if (error) {
      setAlert(error, "danger");
    } else {
      setName("");

      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Tag (Berita)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-editNewsTagModal">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-editNewsTagModal">
        <Input
          label="Nama *"
          type="text"
          name="name"
          placeholder="Nama Tag"
          value={name || ""}
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
export default connect(mapStateToProps, { updateNewsTag, setAlert })(EditTag);
