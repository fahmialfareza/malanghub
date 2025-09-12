import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import { updateNewsDraftApproved } from "../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../redux/actions/layoutActions";
import { RootState } from "../../../redux/store";
import {
  LayoutReducerState,
  NewsDraftReducerState,
} from "../../../redux/types";
import { UpdateNewsDraftApproved } from "../../../redux/actions/types/newsDraft";

interface EditNewsProps {
  layout: LayoutReducerState;
  newsDraft: NewsDraftReducerState;
  updateNewsDraftApproved: (
    formData: UpdateNewsDraftApproved,
    id: string
  ) => void;
  setAlert: (message: string, type: string) => void;
}

const EditNews = ({
  layout: { theme },
  newsDraft: { currentNewsDraft, error },
  updateNewsDraftApproved,
  setAlert,
}: EditNewsProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (currentNewsDraft) {
      setTitle(currentNewsDraft.title);
      setContent(currentNewsDraft.content);
    }
  }, [currentNewsDraft]);

  const hideModal = () => {
    // @ts-ignore
    window.$("#editNewsModal").modal("toggle");
  };

  const handleApproved = (event: ChangeEvent<HTMLInputElement>) => {
    let trueFalse = event.target.checked;

    setApproved(trueFalse);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    const data: UpdateNewsDraftApproved = {
      title,
      content,
      approved,
      message,
    };

    if (currentNewsDraft) {
      updateNewsDraftApproved(data, currentNewsDraft._id);
    }

    if (error) {
      setAlert(error, "danger");
    } else {
      const checkbox = document.querySelectorAll("input[type=checkbox]");
      // @ts-ignore
      checkbox.forEach((el) => (el.checked = false));

      setMessage("");

      hideModal();
    }
  };

  return (
    <>
      <div className="modal fade" id="editNewsModal">
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
                Persetujuan Berita
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-editNewsModal">
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
                  <label htmlFor="message">Pesan *</label>
                  <textarea
                    name="message"
                    placeholder="Pesan"
                    className="form-control"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <h4>Persetujuan *</h4>
                  <div className="custom-control custom-switch custom-control-inline">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="approvement"
                      onChange={handleApproved}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="approvement"
                    >
                      Setuju
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" data-dismiss="modal">
                Keluar
              </button>
              <button
                type="submit"
                form="form-editNewsModal"
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
});

export default connect(mapStateToProps, { updateNewsDraftApproved, setAlert })(
  EditNews
);
