import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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
import {
  getNewsTags,
  clearNewsTags,
} from "../../../../redux/actions/newsTagActions";
import { updateNewsDraft } from "../../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import {
  NewsCategoryReducerState,
  NewsDraftReducerState,
  NewsTagReducerState,
} from "../../../../redux/types";
import { RootState } from "../../../../redux/store";
import { CreateUpdateNewsDraft } from "../../../../redux/actions/types/newsDraft";

interface EditNewsDraftProps {
  open: boolean;
  onClose: () => void;
  newsDraft: NewsDraftReducerState;
  newsCategory: NewsCategoryReducerState;
  newsTag: NewsTagReducerState;
  getNewsTags: () => void;
  clearNewsTags: () => void;
  updateNewsDraft: (formData: CreateUpdateNewsDraft, id: string) => void;
  setAlert: (message: string, type: string) => void;
}

const EditNewsDraft = ({
  open,
  onClose,
  newsDraft: { myNewsDrafts, currentNewsDraft, error },
  newsCategory: { newsCategories },
  newsTag: { newsTags },
  getNewsTags,
  clearNewsTags,
  updateNewsDraft,
  setAlert,
}: EditNewsDraftProps) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState(currentNewsDraft?.title);
  const [category, setCategory] = useState(
    currentNewsDraft?.category as string
  );
  const [mainImage, setMainImage] = useState<File>();
  const [mainImageName, setMainImageName] = useState("");
  const [content, setContent] = useState(currentNewsDraft?.content);
  const [tags, setTags] = useState<string[]>([]);
  const [submitTrigger, setSubmitTrigger] = useState(false);
  const [oldMyNewsDrafts, setOldMyNewsDrafts] = useState(myNewsDrafts);

  useEffect(() => {
    getNewsTags();
  }, []);

  useEffect(() => {
    setTitle(currentNewsDraft?.title);
    setCategory(currentNewsDraft?.category as string);
    setContent(currentNewsDraft?.content);
    setMainImageName("");
    setMainImage(undefined);
    if (currentNewsDraft?.tags && currentNewsDraft?.tags?.length > 0) {
      const selectedTags = currentNewsDraft?.tags;
      setTags(selectedTags as string[]);
    }

    clearNewsTags();
    getNewsTags();
  }, [currentNewsDraft]);

  useEffect(() => {
    if (error) {
      setAlert(error, "danger");
    }

    if (oldMyNewsDrafts !== myNewsDrafts) {
      if (submitTrigger && !error) {
        setAlert("Berita Anda berhasil di update!", "success");

        setSubmitTrigger(false);
        setOldMyNewsDrafts(myNewsDrafts);

        onClose();
      }
    }
  }, [myNewsDrafts, error]);

  const handleTags = (event: ChangeEvent<HTMLInputElement>) => {
    let trueFalse = event.target.checked;
    let value = event.target.id.slice(0, 24);

    if (trueFalse && value) {
      setTags([...tags, value]);
    } else {
      setTags(tags.filter((tag) => tag !== value));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (title && category && content && tags.length > 0) {
      let data: CreateUpdateNewsDraft = {
        title,
        category,
        mainImage,
        mainImageName,
        content,
        tags: JSON.stringify(tags),
      };
      if (mainImage) data.mainImage = mainImage;
      if (mainImageName) data.mainImageName = mainImageName;

      if (data && currentNewsDraft) {
        updateNewsDraft(data, currentNewsDraft.id || currentNewsDraft._id);
      }

      setSubmitTrigger(true);
    } else {
      setAlert("Anda harus mengisi semua form yang diwajibkan (*)", "danger");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Berita"
      size="xl"
      allowExternalPopups
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-editNewsDraftModal" value="Submit">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-editNewsDraftModal">
        <Input
          label="Judul *"
          type="text"
          name="title"
          placeholder="Judul"
          value={title || ""}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="grid gap-x-4 md:grid-cols-2">
          <Select
            label="Kategori *"
            id="exampleFormControlSelectEditNewsDraft"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
            required
          >
            <option value="default" disabled>
              Pilih Kategori
            </option>
            {newsCategories &&
              newsCategories.map((category) => (
                <option
                  key={category.id || category._id}
                  value={category.id || category._id}
                >
                  {category.name}
                </option>
              ))}
          </Select>
          <FileInput
            label="Gambar Utama Berita"
            hint="Max Size 1 MB"
            id="newsImageEdit"
            name="mainImage"
            accept="image/*"
            onChange={(event) => {
              if (event.target.files && event.target.files?.length > 0) {
                setMainImage(event.target.files[0]);
                setMainImageName(event.target.files[0].name);
              }
            }}
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
                "advlist autolink lists link image charmap preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table code help wordcount",
                "directionality",
              ].join(" "),
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
                  key={tag.id + "editDraft"}
                  id={tag.id + "editDraft"}
                  label={tag.name}
                  onChange={handleTags}
                  checked={tags?.includes(
                    (tag.id || tag._id || "") as string
                  )}
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
  clearNewsTags,
  updateNewsDraft,
  setAlert,
};

// @ts-ignore
export default connect(mapStateToProps, mapActionToProps)(EditNewsDraft);
