import { useState, useEffect, FormEvent } from "react";
import { connect } from "react-redux";
import { updateProfile } from "../../redux/actions/userActions";
import { setAlert } from "../../redux/actions/layoutActions";
import { RootState } from "../../redux/store";
import { LayoutReducerState, UserReducerState } from "../../redux/types";
import { UpdateProfileRequest } from "../../redux/actions/types/user";
import { User } from "../../models/user";

interface EditProfileModalProps {
  user: UserReducerState;
  layout: LayoutReducerState;
  updateProfile: (formData: UpdateProfileRequest) => void;
  setAlert: (message: string, type: string) => void;
}

const EditProfileModal = ({
  user: { user, error },
  layout: { theme },
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
    // @ts-ignore
    window.$("#editProfileModal").modal("toggle");
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
    <>
      <div className="modal fade" id="editProfileModal">
        <div className="modal-dialog modal-lg">
          <div
            className={
              theme === "dark"
                ? "modal-content bg-dark text-light"
                : "modal-content"
            }
          >
            <div className="modal-header bg-primary text-light">
              <h5 className="modal-title" style={{ color: "#f8f9fa" }}>
                Edit Profil
              </h5>
              <button className="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} id="form-update">
                <div className="form-group">
                  <label htmlFor="name">Nama *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nama"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="image">Update Foto Profil</label>
                  <div className="custom-file">
                    <input
                      type="file"
                      className="custom-file-input"
                      id="image"
                      name="photo"
                      accept="image/*"
                      onChange={(event) => {
                        if (
                          event.target.files &&
                          event.target.files.length > 0
                        ) {
                          setPhoto(event.target.files[0]);
                          setPhotoName(event.target.files[0].name);
                        }
                      }}
                    />
                    <label htmlFor="image" className="custom-file-label">
                      {photoName ? photoName : "Pilih File"}
                    </label>
                  </div>
                  <small className="form-text text-muted">Max Size 1 MB</small>
                </div>
                <div className="form-group">
                  <label htmlFor="motto">Motto</label>
                  <input
                    type="text"
                    name="motto"
                    placeholder="Motto"
                    className="form-control"
                    value={motto}
                    onChange={(event) => setMotto(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="body">Bio</label>
                  <textarea
                    className="form-control"
                    name="name"
                    aria-rowspan={5}
                    placeholder="Bio..."
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    placeholder="malanghub"
                    className="form-control"
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="facebook">Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    placeholder="https://www.facebook.com/malanghub"
                    className="form-control"
                    value={facebook}
                    onChange={(event) => setFacebook(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="twitter">Twitter</label>
                  <input
                    type="text"
                    name="twitter"
                    placeholder="malanghub"
                    className="form-control"
                    value={twitter}
                    onChange={(event) => setTwitter(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tiktok">Tiktok</label>
                  <input
                    type="text"
                    name="tiktok"
                    placeholder="malanghub"
                    className="form-control"
                    value={tiktok}
                    onChange={(event) => setTiktok(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="linkedin">Linkedin</label>
                  <input
                    type="text"
                    name="linkedin"
                    placeholder="https://www.linkedin.com/in/malanghub"
                    className="form-control"
                    value={linkedin}
                    onChange={(event) => setLinkedin(event.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" data-dismiss="modal">
                Keluar
              </button>
              <button
                type="submit"
                form="form-update"
                value="Submit"
                className="btn btn-primary"
              >
                {loading ? "Memuat..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
  layout: state.layout,
});

export default connect(mapStateToProps, { updateProfile, setAlert })(
  EditProfileModal
);
