import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { updateProfile } from "../../redux/actions/userActions";
import { setAlert } from "../../redux/actions/layoutActions";
import { RootState } from "../../redux/store";
import { UserReducerState } from "../../redux/types";
import { UpdateProfileRequest } from "../../redux/actions/types/user";
import { User } from "../../models/user";
import { Button, FileInput, Input, Modal, Textarea } from "@malanghub/ui";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserReducerState;
  updateProfile: (formData: UpdateProfileRequest) => void;
  setAlert: (message: string, type: string) => void;
}

const EditProfileModal = ({
  open,
  onClose,
  user: { user, error },
  updateProfile,
  setAlert,
}: EditProfileModalProps) => {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [photoName, setPhotoName] = useState("");
  const [motto, setMotto] = useState(user?.motto);
  const [bio, setBio] = useState(user?.bio);
  const [instagram, setInstagram] = useState(user?.instagram);
  const [facebook, setFacebook] = useState(user?.facebook);
  const [twitter, setTwitter] = useState(user?.twitter);
  const [tiktok, setTiktok] = useState(user?.tiktok);
  const [linkedin, setLinkedin] = useState(user?.linkedin);
  const [oldUser, setOldUser] = useState<User>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!motto) setMotto(user.motto);
      if (!bio) setBio(user.bio);
      if (!instagram) setInstagram(user.instagram);
      if (!facebook) setFacebook(user.facebook);
      if (!twitter) setTwitter(user.twitter);
      if (!tiktok) setTiktok(user.tiktok);
      if (!linkedin) setLinkedin(user.linkedin);

      if (oldUser) {
        if (oldUser.name === undefined) {
          setOldUser({
            name,
            motto,
            bio,
            instagram,
            facebook,
            twitter,
            tiktok,
            linkedin,
            photo: user.photo,
            _id: user._id,
            email: user.email,
            role: user.role,
            id: user.id,
          });
        }

        if (oldUser.name !== undefined) {
          if (
            oldUser.name !== user.name ||
            oldUser.motto !== user.motto ||
            oldUser.bio !== user.bio ||
            oldUser.instagram !== user.instagram ||
            oldUser.facebook !== user.facebook ||
            oldUser.twitter !== user.twitter ||
            oldUser.tiktok !== user.tiktok ||
            oldUser.linkedin !== user.linkedin ||
            oldUser.photo !== user.photo
          ) {
            setPhoto(undefined);
            setPhotoName("");
            setLoading(false);

            setOldUser({
              name: user.name,
              motto: user.motto,
              bio: user.bio,
              instagram: user.instagram,
              facebook: user.facebook,
              twitter: user.twitter,
              tiktok: user.tiktok,
              linkedin: user.linkedin,
              photo: user.photo,
              _id: user._id,
              email: user.email,
              role: user.role,
              id: user.id,
            });
            hideModal();
          }
        }
      }
    }

    if (error) {
      setAlert(error, "danger");
      setLoading(false);
    }
  }, [user, error]);

  const hideModal = () => {
    onClose();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const data: UpdateProfileRequest = {
      name,
      photo,
      photoName,
      motto,
      bio,
      instagram,
      facebook,
      twitter,
      tiktok,
      linkedin,
    };

    updateProfile(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profil"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-update" loading={loading}>
            {loading ? "Memuat..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} id="form-update">
        <Input
          type="text"
          id="edit-profile-name"
          name="name"
          label="Nama *"
          placeholder="Nama"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <FileInput
          id="edit-profile-photo"
          name="photo"
          label="Update Foto Profil"
          accept="image/*"
          hint={photoName ? `${photoName} - Max Size 1 MB` : "Max Size 1 MB"}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              setPhoto(event.target.files[0]);
              setPhotoName(event.target.files[0].name);
            }
          }}
        />
        <Input
          type="text"
          id="edit-profile-motto"
          name="motto"
          label="Motto"
          placeholder="Motto"
          value={motto}
          onChange={(event) => setMotto(event.target.value)}
        />
        <Textarea
          id="edit-profile-bio"
          name="bio"
          label="Bio"
          rows={5}
          placeholder="Bio..."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Input
            type="text"
            id="edit-profile-instagram"
            name="instagram"
            label="Instagram"
            placeholder="malanghub"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
          <Input
            type="text"
            id="edit-profile-facebook"
            name="facebook"
            label="Facebook"
            placeholder="https://www.facebook.com/malanghub"
            value={facebook}
            onChange={(event) => setFacebook(event.target.value)}
          />
          <Input
            type="text"
            id="edit-profile-twitter"
            name="twitter"
            label="Twitter"
            placeholder="malanghub"
            value={twitter}
            onChange={(event) => setTwitter(event.target.value)}
          />
          <Input
            type="text"
            id="edit-profile-tiktok"
            name="tiktok"
            label="Tiktok"
            placeholder="malanghub"
            value={tiktok}
            onChange={(event) => setTiktok(event.target.value)}
          />
          <Input
            type="text"
            id="edit-profile-linkedin"
            name="linkedin"
            label="Linkedin"
            placeholder="https://www.linkedin.com/in/malanghub"
            value={linkedin}
            onChange={(event) => setLinkedin(event.target.value)}
            wrapperClassName="sm:col-span-2"
          />
        </div>
      </form>
    </Modal>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, { updateProfile, setAlert })(
  EditProfileModal,
);
