import { FormEvent, useState } from "react";
import { connect } from "react-redux";
import { Button, Input, Modal } from "@malanghub/ui";
import { createNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import { CreateUpdateNewsCategory } from "../../../../redux/actions/types/newsCategory";

interface AddCategoryProps {
  open: boolean;
  onClose: () => void;
  createNewsCategory: (formData: CreateUpdateNewsCategory) => void;
  setAlert: (message: string, type: string) => void;
}

const AddCategory = ({
  open,
  onClose,
  createNewsCategory,
}: AddCategoryProps) => {
  const [name, setName] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    createNewsCategory({
      name,
    });

    setName("");

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Kategori (Berita)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-addNewsCategoryModal">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-addNewsCategoryModal">
        <Input
          label="Nama *"
          type="text"
          name="name"
          placeholder="Nama Kategori"
          value={name}
          onChange={(event) => setName(event.target.value)}
          wrapperClassName="tw:mb-0"
        />
      </form>
    </Modal>
  );
};

export default connect(null, {
  createNewsCategory,
  setAlert,
})(AddCategory);
