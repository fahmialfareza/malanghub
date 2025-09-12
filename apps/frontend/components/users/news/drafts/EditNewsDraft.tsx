import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { connect } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import {
  getNewsTags,
  clearNewsTags,
} from "../../../../redux/actions/newsTagActions";
import { updateNewsDraft } from "../../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../../redux/actions/layoutActions";
import {
  LayoutReducerState,
  NewsCategoryReducerState,
  NewsDraftReducerState,
  NewsTagReducerState,
} from "../../../../redux/types";
import { RootState } from "../../../../redux/store";
import { CreateUpdateNewsDraft } from "../../../../redux/actions/types/newsDraft";

interface EditNewsDraftProps {
  layout: LayoutReducerState;
  newsDraft: NewsDraftReducerState;
  newsCategory: NewsCategoryReducerState;
  newsTag: NewsTagReducerState;
  getNewsTags: () => void;
  clearNewsTags: () => void;
  updateNewsDraft: (formData: CreateUpdateNewsDraft, id: string) => void;
  setAlert: (message: string, type: string) => void;
}

const EditNewsDraft = ({
  layout: { theme },
  newsDraft: { myNewsDrafts, currentNewsDraft, error },
  newsCategory: { newsCategories },
  newsTag: { newsTags },
  getNewsTags,
  clearNewsTags,
  updateNewsDraft,
  setAlert,
}: EditNewsDraftProps) => {
  const [title, setTitle] = useState(currentNewsDraft?.title);
  const [category, setCategory] = useState(currentNewsDraft?.category._id);
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
    setCategory(currentNewsDraft?.category._id);
    setContent(currentNewsDraft?.content);
    setMainImageName("");
    setMainImage(undefined);
    if (currentNewsDraft?.tags && currentNewsDraft?.tags?.length > 0) {
      const selectedTags = currentNewsDraft?.tags?.map((tag) => tag._id);
      setTags(selectedTags);
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

        const checkbox = document.querySelectorAll("input[type=checkbox]");
        // @ts-ignore
        checkbox.forEach((el) => (el.checked = false));

        setSubmitTrigger(false);
        setOldMyNewsDrafts(myNewsDrafts);

        hideModal();
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

  const hideModal = () => {
    // @ts-ignore
    window.$("#editNewsDraftModal").modal("toggle");
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
        updateNewsDraft(data, currentNewsDraft._id);
      }

      setSubmitTrigger(true);
    } else {
      setAlert("Anda harus mengisi semua form yang diwajibkan (*)", "danger");
    }
  };

  return (
    <>
      <div className="modal fade" id="editNewsDraftModal">
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
                Edit Berita
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-editNewsDraftModal">
                <div className="form-group">
                  <label htmlFor="title">Judul *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Judul"
                    className="form-control"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="exampleFormControlSelectEditNewsDraft">
                    Kategori *
                  </label>
                  <select
                    className="form-control"
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
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="newsImageEdit">Gambar Utama Berita</label>
                  <div className="custom-file">
                    <input
                      type="file"
                      className="custom-file-input"
                      id="newsImageEdit"
                      name="mainImage"
                      accept="image/*"
                      onChange={(event) => {
                        if (
                          event.target.files &&
                          event.target.files?.length > 0
                        ) {
                          setMainImage(event.target.files[0]);
                          setMainImageName(event.target.files[0].name);
                        }
                      }}
                    />
                    <label htmlFor="image" className="custom-file-label">
                      {mainImageName ? mainImageName : "Pilih File"}
                    </label>
                  </div>
                  <small className="form-text text-muted">Max Size 1 MB</small>
                </div>
                <div className="form-group">
                  <label htmlFor="content">Konten *</label>
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY}
                    value={content}
                    init={{
                      height: 500,
                      menubar: true,
                      plugins: [
                        "advlist autolink lists link image charmap print preview anchor",
                        "searchreplace visualblocks code fullscreen",
                        "insertdatetime media table paste code help wordcount",
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
                <div className="form-group">
                  <h4>Pilih tag (harus memilih salah satu atau lebih) *</h4>
                  {newsTags &&
                    newsTags.map((tag) => (
                      <div
                        key={tag._id + "editDraft"}
                        className="custom-control custom-switch custom-control-inline"
                      >
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id={tag._id + "editDraft"}
                          onChange={(event) => {}}
                          defaultChecked={tags?.includes(tag._id)}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor={tag._id + "editDraft"}
                        >
                          {tag.name}
                        </label>
                      </div>
                    ))}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" data-dismiss="modal">
                Keluar
              </button>
              <button
                type="submit"
                form="form-editNewsDraftModal"
                value="Submit"
                className="btn btn-primary"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  layout: state.layout,
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
