import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { connect } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import {
  Button,
  Checkbox,
  FileInput,
  Input,
  Modal,
  Select,
  labelClass,
  useTheme,
} from "@malanghub/ui";
import { getNewsTags } from "../../../redux/actions/newsTagActions";
import { createNewsDraft } from "../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../redux/actions/layoutActions";
import { RootState } from "../../../redux/store";
import {
  NewsCategoryReducerState,
  NewsDraftReducerState,
  NewsTagReducerState,
} from "../../../redux/types";
import { CreateUpdateNewsDraft } from "../../../redux/actions/types/newsDraft";

interface AddNewsProps {
  open: boolean;
  onClose: () => void;
  newsDraft: NewsDraftReducerState;
  newsCategory: NewsCategoryReducerState;
  newsTag: NewsTagReducerState;
  getNewsTags: () => void;
  createNewsDraft: (formData: CreateUpdateNewsDraft) => void;
  setAlert: (message: string, type: string) => void;
}

const AddNews = ({
  open,
  onClose,
  newsDraft: { myNewsDrafts, error },
  newsCategory: { newsCategories },
  newsTag: { newsTags },
  getNewsTags,
  createNewsDraft,
  setAlert,
}: AddNewsProps) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("default");
  const [mainImage, setMainImage] = useState<File>();
  const [mainImageName, setMainImageName] = useState<string>("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitTrigger, setSubmitTrigger] = useState(false);
  const [oldMyNewsDrafts, setOldMyNewsDrafts] = useState(myNewsDrafts);

  useEffect(() => {
    getNewsTags();
  }, []);

  const handleTags = (event: ChangeEvent<HTMLInputElement>) => {
    let trueFalse = event.target.checked;
    let value = event.target.id;

    if (trueFalse && value) {
      setTags([...tags, value]);
    } else {
      setTags(tags.filter((tag) => tag !== value));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (
      title &&
      category &&
      mainImage &&
      mainImageName &&
      content &&
      tags.length > 0
    ) {
      createNewsDraft({
        title,
        category,
        mainImage,
        mainImageName,
        content,
        tags: JSON.stringify(tags),
      });

      setSubmitTrigger(true);
    } else {
      setAlert("Anda harus mengisi semua form yang diwajibkan (*)", "danger");
    }
  };

  useEffect(() => {
    if (error) {
      setAlert(error, "danger");
      setTags([]);
    }

    if (oldMyNewsDrafts?.length !== myNewsDrafts?.length) {
      if (submitTrigger && !error) {
        setTitle("");
        setCategory("default");
        setMainImage(undefined);
        setMainImageName("");
        setContent("");
        setTags([]);

        setAlert("Berita Anda masuk Antrian Berita!", "success");

        setSubmitTrigger(false);
        setOldMyNewsDrafts(myNewsDrafts);

        onClose();
      }
    }
  }, [myNewsDrafts, submitTrigger, error]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Berita"
      size="xl"
      allowExternalPopups
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button
            type="submit"
            form="form-addNewsModal"
            value="Submit"
          >
            {submitTrigger ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-addNewsModal">
        <Input
          label="Judul *"
          type="text"
          name="title"
          placeholder="Judul"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <div className="grid gap-x-4 md:grid-cols-2">
          <Select
            label="Kategori *"
            id="exampleFormControlSelect1"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
            required
          >
            <option value="default" disabled>
              Pilih Kategori
            </option>
            {newsCategories &&
              newsCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </Select>
          <FileInput
            label="Gambar Utama Berita *"
            hint="Max Size 1 MB"
            id="newsImage"
            name="mainImage"
            accept="image/*"
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                setMainImage(event.target.files[0]);
                setMainImageName(event.target.files[0].name);
              }
            }}
            required
          />
        </div>
        <div className="mb-4">
          <div className={labelClass}>Konten *</div>
          <Editor
            key={theme}
            apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY}
            value={content}
            init={{
              height: 500,
              menubar: true,
              skin: theme === "dark" ? "oxide-dark" : "oxide",
              content_css: theme === "dark" ? "dark" : "default",
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "print",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "paste",
                "code",
                "help",
                "wordcount",
                "directionality",
              ],
              toolbar:
                "ltr rtl | undo redo | formatselect | bold italic backcolor | \
             alignleft aligncenter alignright alignjustify | \
             bullist numlist outdent indent | removeformat | help",
              file_picker_types: "file image media",
              image_caption: true,
              image_advtab: false,
              image_description: false,
              automatic_uploads: true,
              image_dimensions: false,
              image_title: false,
              image_class_list: [
                {
                  title: "Responsive",
                  value: "img-fluid rounded mx-auto my-2 d-block",
                },
              ],
              images_upload_url: `${process.env.NEXT_PUBLIC_API_ADDRESS}/api/upload`,
            }}
            onEditorChange={(text) => setContent(text)}
          />
        </div>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={labelClass}>
            Pilih tag (harus memilih salah satu atau lebih) *
          </legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {newsTags &&
              newsTags.map((tag) => (
                <Checkbox
                  key={tag.id}
                  id={tag.id}
                  label={tag.name}
                  checked={tags.includes(tag.id as string)}
                  onChange={handleTags}
                />
              ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsDraft: state.newsDraft,
  newsCategory: state.newsCategory,
  newsTag: state.newsTag,
});

const mapActionToProps = {
  getNewsTags,
  createNewsDraft,
  setAlert,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(AddNews);
