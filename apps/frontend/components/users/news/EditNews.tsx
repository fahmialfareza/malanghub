import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Textarea,
  labelClass,
  useTheme,
} from "@malanghub/ui";
import { updateNewsDraftApproved } from "../../../redux/actions/newsDraftActions";
import { setAlert } from "../../../redux/actions/layoutActions";
import { RootState } from "../../../redux/store";
import { NewsDraftReducerState } from "../../../redux/types";
import { UpdateNewsDraftApproved } from "../../../redux/actions/types/newsDraft";

interface EditNewsProps {
  open: boolean;
  onClose: () => void;
  newsDraft: NewsDraftReducerState;
  updateNewsDraftApproved: (
    formData: UpdateNewsDraftApproved,
    id: string
  ) => void;
  setAlert: (message: string, type: string) => void;
}

const EditNews = ({
  open,
  onClose,
  newsDraft: { currentNewsDraft, error },
  updateNewsDraftApproved,
  setAlert,
}: EditNewsProps) => {
  const { theme } = useTheme();
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
      updateNewsDraftApproved(
        data,
        currentNewsDraft.id || currentNewsDraft._id
      );
    }

    if (error) {
      setAlert(error, "danger");
    } else {
      setApproved(false);
      setMessage("");

      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Persetujuan Berita"
      size="xl"
      allowExternalPopups
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-editNewsModal" value="Submit">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-editNewsModal">
        <Input
          label="Judul *"
          type="text"
          name="title"
          placeholder="Judul"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
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
        <Textarea
          label="Pesan *"
          name="message"
          placeholder="Pesan"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
        />
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={labelClass}>Persetujuan *</legend>
          <Checkbox
            id="approvement"
            label="Setuju"
            checked={approved}
            onChange={handleApproved}
            wrapperClassName="mb-0"
          />
        </fieldset>
      </form>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  newsDraft: state.newsDraft,
});

export default connect(mapStateToProps, { updateNewsDraftApproved, setAlert })(
  EditNews
);
