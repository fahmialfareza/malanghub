import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { Button, Input, Modal } from "@malanghub/ui";
import { updateNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { RootState } from "../../../../redux/store";
import { NewsCategoryReducerState } from "../../../../redux/types";
import { CreateUpdateNewsCategory } from "../../../../redux/actions/types/newsCategory";

interface EditCategoryProps {
  open: boolean;
  onClose: () => void;
  newsCategory: NewsCategoryReducerState;
  updateNewsCategory: (formData: CreateUpdateNewsCategory, id: string) => void;
  setAlert: (message: string, type: string) => void;
}

const EditCategory = ({
  open,
  onClose,
  newsCategory: { currentNewsCategory, error },
  updateNewsCategory,
  setAlert,
}: EditCategoryProps) => {
  const [name, setName] = useState(currentNewsCategory?.name);

  useEffect(() => {
    setName(currentNewsCategory?.name);
  }, [currentNewsCategory]);

  useEffect(() => {
    if (error) {
      setAlert(error, "danger");
    }
  }, [error]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (name && currentNewsCategory) {
      updateNewsCategory(
        {
          name,
        },
        currentNewsCategory?.id || currentNewsCategory?._id
      );
    }

    setName("");

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Kategori (Berita)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-editNewsCategoryModal">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-editNewsCategoryModal">
        <Input
          label="Nama *"
          type="text"
          name="name"
          placeholder="Nama Kategori"
          value={name || ""}
          onChange={(event) => setName(event.target.value)}
          wrapperClassName="mb-0"
        />
      </form>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsCategory: state.newsCategory,
});

const mapActionToProps = {
  updateNewsCategory,
  setAlert,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(EditCategory);
