import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  type CreateUpdateNewsDraftRequest,
  type News,
  type NewsCategoryFull,
  type NewsTag,
  type UpdateProfileRequest,
  type UserProfile,
  useAllDrafts,
  useApproveDraftMutation,
  useCategories,
  useCreateCategoryMutation,
  useCreateDraftMutation,
  useCreateTagMutation,
  useCurrentUser,
  useDeleteCategoryMutation,
  useDeleteDraftMutation,
  useDeleteTagMutation,
  useDraftDetail,
  useMyDrafts,
  useMyNews,
  useTags,
  useUpdateCategoryMutation,
  useUpdateDraftMutation,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
  useUpdateTagMutation,
} from "@malanghub/core";
import { useAdapters } from "./adapters";
import { useMalanghubRuntime } from "./providers";
import {
  excerpt,
  formatDate,
  getAuthorHref,
  getCategoryHref,
  getCategoryName,
  getSocialHref,
  readingTime,
  siteUrl,
} from "./utils";

const DEFAULT_AVATAR_SRC = "/assets/images/author.jpg";

type DashboardSection = "category" | "tag" | "news";
type NewsTableName = "Berita" | "Antrian Berita" | "Persetujuan Berita";
type ModalKind =
  | "profile"
  | "addCategory"
  | "editCategory"
  | "deleteCategory"
  | "addTag"
  | "editTag"
  | "deleteTag"
  | "addNews"
  | "editDraft"
  | "deleteDraft"
  | "approveDraft";

const getId = (value?: { id?: string; _id?: string } | null) =>
  value?.id ?? value?._id ?? "";

const getNewsCategoryId = (news?: News | null) => {
  if (!news?.category) return "";
  return typeof news.category === "string" ? news.category : getId(news.category);
};

const getNewsTagIds = (news?: News | null) =>
  (news?.tags ?? [])
    .map((tag) => (typeof tag === "string" ? tag : getId(tag)))
    .filter(Boolean);

const getNewsTags = (news: News) =>
  (news.tags ?? []).filter(
    (tag): tag is Exclude<(typeof news.tags)[number], string> =>
      typeof tag !== "string"
  );

const formatDateTime = (value?: string | Date) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
};

const isAdmin = (user?: UserProfile) => Boolean(user?.role?.includes("admin"));

const isNativeMobileApp = () => {
  if (
    typeof document !== "undefined" &&
    document.body.classList.contains("malanghub-native-mobile")
  ) {
    return true;
  }

  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /Android|iPad|iPhone|iPod/i.test(userAgent) ||
    (/Mac/i.test(platform) && navigator.maxTouchPoints > 1)
  );
};

const useThemeSnapshot = () => {
  const readTheme = () =>
    typeof document === "undefined"
      ? "light"
      : document.documentElement.getAttribute("data-theme") ?? "light";
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
};

const Spinner = () => (
  <div className="malanghub-loading" aria-live="polite">
    Loading...
  </div>
);

const Breadcrumbs = ({ label }: { label: string }) => {
  const { Link } = useAdapters();

  return (
    <nav id="breadcrumbs" className="breadcrumbs">
      <div className="container page-wrapper">
        <Link href="/">Beranda</Link> /{" "}
        <span className="breadcrumb_last" aria-current="page">
          {label}
        </span>
      </div>
    </nav>
  );
};

const DraftBreadcrumbs = ({ label }: { label: string }) => {
  const { Link } = useAdapters();

  return (
    <nav id="breadcrumbs" className="breadcrumbs">
      <div className="container page-wrapper">
        <Link href="/">Beranda</Link> / Antrian Berita /{" "}
        <span className="breadcrumb_last" aria-current="page">
          {label}
        </span>
      </div>
    </nav>
  );
};

const Modal = ({
  title,
  open,
  onClose,
  children,
  footer,
  danger,
}: {
  title: string;
  open: boolean;
  onClose(): void;
  children: React.ReactNode;
  footer: React.ReactNode;
  danger?: boolean;
}) => {
  const theme = useThemeSnapshot();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    document.body.classList.add("malanghub-modal-open");

    return () => {
      document.body.classList.remove("malanghub-modal-open");
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block malanghub-modal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div
            className={
              theme === "dark"
                ? "modal-content bg-dark text-light"
                : "modal-content"
            }
          >
            <div className={danger ? "modal-header bg-danger" : "modal-header bg-primary"}>
              <h5 className="modal-title" style={{ color: "#f8f9fa" }}>
                {title}
              </h5>
              <button className="close" type="button" onClick={onClose}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">{footer}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show malanghub-modal-backdrop" onClick={onClose} />
    </>
  );
};

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange(value: string): void;
}) => {
  const adapters = useAdapters();
  const editorIdRef = useRef(
    `malanghub-richtext-${Math.random().toString(36).slice(2)}`,
  );

  if (isNativeMobileApp() || !adapters.tinyApiKey) {
    return (
      <textarea
        className="form-control malanghub-richtext-fallback"
        rows={14}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <Editor
      key={editorIdRef.current}
      id={editorIdRef.current}
      apiKey={adapters.tinyApiKey}
      value={value}
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
          "ltr rtl | undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
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
        images_upload_url: `${adapters.apiBaseUrl ?? ""}/api/upload`,
      }}
      onEditorChange={(text) => onChange(text)}
    />
  );
};

const ProfileHero = ({
  user,
  onEdit,
  onLogout,
  onDeleteAccount,
}: {
  user?: UserProfile;
  onEdit(): void;
  onLogout(): void | Promise<void>;
  onDeleteAccount(): void;
}) => {
  const { Image } = useAdapters();

  return (
    <section id="author" className="w3l-author py-5">
      <div className="container py-md-3">
        <div className="row align-items-center">
          <div className="col-md-3 col-sm-4 col-7 order-first">
            <div className="embed-responsive embed-responsive-1by1">
              <Image
                src={user?.photo || DEFAULT_AVATAR_SRC}
                alt=""
                className="rounded-circle img-fluid embed-responsive-item"
                objectFit="cover"
                fill
              />
            </div>
          </div>
          <div className="col-md-9 col-sm-12 order-md-first mt-lg-0 mt-4">
            <span className="category">{user?.motto}</span>
            <h1 className="mb-4 title">
              Halo, <span className="typed-text">{user?.name}</span>
              <span className="cursor typing">&nbsp;</span>
            </h1>
            {user?.bio && (
              <p dangerouslySetInnerHTML={{ __html: user.bio }} />
            )}
            <SocialLinks user={user} />
            <div className="malanghub-profile-actions mt-4">
              <button className="btn btn-primary" type="button" onClick={onEdit}>
                <span className="fa fa-edit mr-2" />
                Edit Profil
              </button>
              <button className="btn btn-outline-danger" type="button" onClick={onLogout}>
                <span className="fa fa-sign-out-alt mr-2" />
                Keluar
              </button>
              <button className="btn btn-outline-danger malanghub-delete-account-btn" type="button" onClick={onDeleteAccount}>
                <span className="fa fa-trash mr-2" aria-hidden="true" />
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialLinks = ({ user }: { user?: UserProfile }) => (
  <ul className="author-icons mt-4">
    {user?.facebook && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="facebook"
          href={getSocialHref("facebook", user.facebook)}
        >
          <span className="fab fa-facebook" aria-hidden="true" />
        </a>
      </li>
    )}
    {user?.twitter && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="twitter"
          href={getSocialHref("twitter", user.twitter)}
        >
          <span className="fab fa-twitter" aria-hidden="true" />
        </a>
      </li>
    )}
    {user?.instagram && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="instagram"
          href={getSocialHref("instagram", user.instagram)}
        >
          <span className="fab fa-instagram" aria-hidden="true" />
        </a>
      </li>
    )}
    {user?.linkedin && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="linkedin"
          href={getSocialHref("linkedin", user.linkedin)}
        >
          <span className="fab fa-linkedin" aria-hidden="true" />
        </a>
      </li>
    )}
    {user?.tiktok && (
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          className="tiktok"
          href={getSocialHref("tiktok", user.tiktok)}
        >
          <span className="fab fa-tiktok" aria-hidden="true" />
        </a>
      </li>
    )}
  </ul>
);

const EditProfileModal = ({
  user,
  open,
  onClose,
}: {
  user?: UserProfile;
  open: boolean;
  onClose(): void;
}) => {
  const { api, notify, refreshAuth } = useMalanghubRuntime();
  const adapters = useAdapters();
  const updateProfile = useUpdateProfileMutation(api);
  const [form, setForm] = useState({
    name: "",
    motto: "",
    bio: "",
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    linkedin: "",
  });
  const [photo, setPhoto] = useState<File | undefined>();
  const [photoName, setPhotoName] = useState("");

  useEffect(() => {
    if (!user || !open) return;
    setForm({
      name: user.name ?? "",
      motto: user.motto ?? "",
      bio: user.bio ?? "",
      instagram: user.instagram ?? "",
      facebook: user.facebook ?? "",
      twitter: user.twitter ?? "",
      tiktok: user.tiktok ?? "",
      linkedin: user.linkedin ?? "",
    });
    setPhoto(undefined);
    setPhotoName("");
  }, [open, user]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const data: UpdateProfileRequest = { ...form, photo, photoName };

    updateProfile.mutate(data, {
      onSuccess: () => {
        refreshAuth();
        notify("Profil berhasil diperbarui", "success");
        onClose();
      },
      onError: (error) => {
        adapters.reportError?.(error);
        notify(error instanceof Error ? error.message : "Gagal memperbarui profil", "danger");
      },
    });
  };

  return (
    <Modal
      title="Edit Profil"
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-primary" type="button" onClick={onClose}>
            Keluar
          </button>
          <button type="submit" form="form-update-profile" className="btn btn-primary" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      }
    >
      <form onSubmit={submit} id="form-update-profile">
        <TextInput label="Nama *" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
        <div className="form-group">
          <label htmlFor="profilePhoto">Update Foto Profil</label>
          <div className="custom-file">
            <input
              type="file"
              className="custom-file-input"
              id="profilePhoto"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhoto(file);
                setPhotoName(file?.name ?? "");
              }}
            />
            <label htmlFor="profilePhoto" className="custom-file-label">
              {photoName || "Pilih File"}
            </label>
          </div>
          <small className="form-text text-muted">Max Size 1 MB</small>
        </div>
        <TextInput label="Motto" value={form.motto} onChange={(motto) => setForm({ ...form, motto })} />
        <div className="form-group">
          <label htmlFor="profileBio">Bio</label>
          <textarea
            id="profileBio"
            className="form-control"
            placeholder="Bio..."
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </div>
        <TextInput label="Instagram" value={form.instagram} placeholder="malanghub" onChange={(instagram) => setForm({ ...form, instagram })} />
        <TextInput label="Facebook" value={form.facebook} placeholder="https://www.facebook.com/malanghub" onChange={(facebook) => setForm({ ...form, facebook })} />
        <TextInput label="Twitter" value={form.twitter} placeholder="malanghub" onChange={(twitter) => setForm({ ...form, twitter })} />
        <TextInput label="Tiktok" value={form.tiktok} placeholder="malanghub" onChange={(tiktok) => setForm({ ...form, tiktok })} />
        <TextInput label="Linkedin" value={form.linkedin} placeholder="https://linkedin.com/in/malanghub" onChange={(linkedin) => setForm({ ...form, linkedin })} />
      </form>
    </Modal>
  );
};

const DeleteAccountModal = ({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  isPending: boolean;
}) => (
  <Modal
    title="Hapus Akun"
    open={open}
    onClose={onClose}
    danger
    footer={
      <>
        <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isPending}>
          Batal
        </button>
        <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={isPending}>
          <span className="fa fa-trash mr-2" aria-hidden="true" />
          {isPending ? "Menghapus..." : "Ya, Hapus Akun"}
        </button>
      </>
    }
  >
    <div className="malanghub-delete-account-warning">
      <div className="malanghub-delete-account-icon-wrap">
        <span className="fa fa-trash" aria-hidden="true" />
      </div>
      <h5 className="malanghub-delete-account-title">Hapus Akun Permanen?</h5>
      <p className="malanghub-delete-account-desc">
        Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua data
        profil, artikel, dan aktivitas kamu akan dihapus selamanya dan tidak
        bisa dipulihkan.
      </p>
    </div>
  </Modal>
);

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value?: string;
  onChange(value: string): void;
  placeholder?: string;
  required?: boolean;
}) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type="text"
      className="form-control"
      placeholder={placeholder ?? label.replace(" *", "")}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    />
  </div>
);

const tableClass = (theme: string) =>
  theme === "dark" ? "table table-striped table-dark" : "table table-striped";

const cardClass = (theme: string) =>
  theme === "dark" ? "card bg-dark" : "card";

const headerClass = (theme: string) =>
  theme === "dark" ? "card-header text-light" : "card-header";

const DashboardWorkbench = ({ user }: { user: UserProfile }) => {
  const admin = isAdmin(user);
  const [activeSection, setActiveSection] = useState<DashboardSection>(
    admin ? "category" : "news"
  );

  useEffect(() => {
    setActiveSection(admin ? "category" : "news");
  }, [admin]);

  return (
    <>
      <header id="main-header" className="py-2">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h1>
                <i className="fa fa-cog" aria-hidden="true" /> Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <section id="actions" className="py-4 mb-4">
        <div className="container">
          <div className="row justify-content-center">
            {admin && (
              <DashboardAction label="Kategori" icon="fa-list-alt" onClick={() => setActiveSection("category")} />
            )}
            {admin && (
              <DashboardAction label="Tag" icon="fa-tag" onClick={() => setActiveSection("tag")} />
            )}
            <DashboardAction label="Berita" icon="fa-newspaper-o" onClick={() => setActiveSection("news")} />
          </div>
        </div>
      </section>

      {admin && activeSection === "category" && <CategoryManager />}
      {admin && activeSection === "tag" && <TagManager />}
      {activeSection === "news" && <NewsManager user={user} />}
    </>
  );
};

const DashboardAction = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick(): void;
}) => (
  <div className="col">
    <a
      href="#"
      className="port-item btn btn-primary btn-block"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      <i className={`fa ${icon}`} aria-hidden="true" /> {label}
    </a>
  </div>
);

const CategoryManager = () => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const theme = useThemeSnapshot();
  const categories = useCategories(api);
  const createCategory = useCreateCategoryMutation(api);
  const updateCategory = useUpdateCategoryMutation(api);
  const deleteCategory = useDeleteCategoryMutation(api);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selected, setSelected] = useState<NewsCategoryFull | null>(null);

  const mutate = (
    action: "create" | "update" | "delete",
    name?: string,
    category?: NewsCategoryFull | null
  ) => {
    const onError = (error: unknown) => {
      adapters.reportError?.(error);
      notify(error instanceof Error ? error.message : "Gagal menyimpan kategori", "danger");
    };
    const onSuccess = () => {
      notify("Kategori berhasil disimpan", "success");
      setModal(null);
    };

    if (action === "create" && name) createCategory.mutate({ name }, { onSuccess, onError });
    if (action === "update" && name && category) updateCategory.mutate({ id: getId(category), data: { name } }, { onSuccess, onError });
    if (action === "delete" && category) deleteCategory.mutate(getId(category), { onSuccess, onError });
  };

  return (
    <>
      <section id="category" className="collapse show mb-5">
        <section id="actions" className="py-4 mb-1">
          <div className="container">
            <div className="row">
              <div className="col-md-3">
                <a href="#" className="btn btn-primary btn-block" onClick={(event) => { event.preventDefault(); setModal("addCategory"); }}>
                  <i className="fa fa-plus" aria-hidden="true" /> Tambah Kategori
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <div className="row">
            <div className="col-md-9 mb-2">
              <div className={cardClass(theme)}>
                <div className={headerClass(theme)}>
                  <h4>Kategori (Berita)</h4>
                </div>
                <div className="table-responsive">
                  <table className={tableClass(theme)}>
                    <thead className={theme === "dark" ? "thead-dark" : "thead-light"}>
                      <tr>
                        <th>ID</th>
                        <th>Nama Kategori</th>
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {categories.isLoading ? (
                        <tr><td colSpan={5}><Spinner /></td></tr>
                      ) : (
                        categories.data?.map((category, index) => (
                          <tr key={getId(category)}>
                            <td>{index + 1}</td>
                            <td>{category.name}</td>
                            <td>{formatDate(category.created_at)}</td>
                            <td>{formatDate(category.updated_at ?? category.created_at)}</td>
                            <td>
                              <button className="btn btn-primary m-1" onClick={() => { setSelected(category); setModal("editCategory"); }}>
                                <i className="fa fa-edit" aria-hidden="true" /> Edit
                              </button>
                              <button className="btn btn-danger m-1" onClick={() => { setSelected(category); setModal("deleteCategory"); }}>
                                <i className="fa fa-trash" aria-hidden="true" /> Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <CounterCard title="Kategori" count={categories.data?.length ?? 0} loading={categories.isLoading} />
          </div>
        </div>
      </section>
      <TaxonomyModal title="Tambah Kategori (Berita)" open={modal === "addCategory"} onClose={() => setModal(null)} onSubmit={(name) => mutate("create", name)} />
      <TaxonomyModal title="Edit Kategori (Berita)" open={modal === "editCategory"} initialName={selected?.name} onClose={() => setModal(null)} onSubmit={(name) => mutate("update", name, selected)} />
      <ConfirmModal title="Hapus Kategori (Berita)" message="Apakah anda yakin ingin menghapus kategori?" open={modal === "deleteCategory"} onClose={() => setModal(null)} onConfirm={() => mutate("delete", undefined, selected)} />
    </>
  );
};

const TagManager = () => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const theme = useThemeSnapshot();
  const tags = useTags(api);
  const createTag = useCreateTagMutation(api);
  const updateTag = useUpdateTagMutation(api);
  const deleteTag = useDeleteTagMutation(api);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selected, setSelected] = useState<NewsTag | null>(null);

  const mutate = (action: "create" | "update" | "delete", name?: string, tag?: NewsTag | null) => {
    const onError = (error: unknown) => {
      adapters.reportError?.(error);
      notify(error instanceof Error ? error.message : "Gagal menyimpan tag", "danger");
    };
    const onSuccess = () => {
      notify("Tag berhasil disimpan", "success");
      setModal(null);
    };

    if (action === "create" && name) createTag.mutate({ name }, { onSuccess, onError });
    if (action === "update" && name && tag) updateTag.mutate({ id: getId(tag), data: { name } }, { onSuccess, onError });
    if (action === "delete" && tag) deleteTag.mutate(getId(tag), { onSuccess, onError });
  };

  return (
    <>
      <section id="tag" className="collapse show mb-5">
        <section id="actions" className="py-4 mb-1">
          <div className="container">
            <div className="row">
              <div className="col-md-3">
                <a href="#" className="btn btn-primary btn-block" onClick={(event) => { event.preventDefault(); setModal("addTag"); }}>
                  <i className="fa fa-plus" aria-hidden="true" /> Tambah Tag
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <div className="row">
            <div className="col-md-9 mb-2">
              <div className={cardClass(theme)}>
                <div className={headerClass(theme)}>
                  <h4>Tag (Berita)</h4>
                </div>
                <div className="table-responsive">
                  <table className={tableClass(theme)}>
                    <thead className={theme === "dark" ? "thead-dark" : "thead-light"}>
                      <tr>
                        <th>ID</th>
                        <th>Nama Tag</th>
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {tags.data?.map((tag, index) => (
                        <tr key={getId(tag)}>
                          <td>{index + 1}</td>
                          <td>{tag.name}</td>
                          <td>{formatDate(tag.created_at)}</td>
                          <td>{formatDate(tag.updated_at ?? tag.created_at)}</td>
                          <td>
                            <button className="btn btn-primary m-1" onClick={() => { setSelected(tag); setModal("editTag"); }}>
                              <i className="fa fa-edit" aria-hidden="true" /> Edit
                            </button>
                            <button className="btn btn-danger m-1" onClick={() => { setSelected(tag); setModal("deleteTag"); }}>
                              <i className="fa fa-trash" aria-hidden="true" /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <CounterCard title="Tag" count={tags.data?.length ?? 0} loading={tags.isLoading} />
          </div>
        </div>
      </section>
      <TaxonomyModal title="Tambah Tag (Berita)" open={modal === "addTag"} onClose={() => setModal(null)} onSubmit={(name) => mutate("create", name)} />
      <TaxonomyModal title="Edit Tag (Berita)" open={modal === "editTag"} initialName={selected?.name} onClose={() => setModal(null)} onSubmit={(name) => mutate("update", name, selected)} />
      <ConfirmModal title="Hapus Tag (Berita)" message="Apakah anda yakin ingin menghapus tag?" open={modal === "deleteTag"} onClose={() => setModal(null)} onConfirm={() => mutate("delete", undefined, selected)} />
    </>
  );
};

const CounterCard = ({
  title,
  count,
  loading,
}: {
  title: string;
  count: number;
  loading?: boolean;
}) => (
  <div className="col-md-3">
    <div className="card text-center bg-primary text-light mb-3">
      <div className="card-body">
        <h3 style={{ color: "#f8f9fa" }}>{title}</h3>
        <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
          <i className="fa fa-pencil-alt" aria-hidden="true" />{" "}
          {loading ? <Spinner /> : count}
        </h4>
        <a href="#" className="port-item btn btn-outline-light btn-sm" onClick={(event) => event.preventDefault()}>
          Lihat
        </a>
      </div>
    </div>
  </div>
);

const TaxonomyModal = ({
  title,
  open,
  initialName,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  initialName?: string;
  onClose(): void;
  onSubmit(name: string): void;
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initialName ?? "");
  }, [initialName, open]);

  return (
    <Modal
      title={title}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-primary" type="button" onClick={onClose}>
            Keluar
          </button>
          <button type="submit" form={`form-${title}`} className="btn btn-primary">
            Simpan
          </button>
        </>
      }
    >
      <form id={`form-${title}`} onSubmit={(event) => { event.preventDefault(); onSubmit(name); }}>
        <TextInput label="Nama *" value={name} placeholder={title.includes("Tag") ? "Nama Tag" : "Nama Kategori"} onChange={setName} required />
      </form>
    </Modal>
  );
};

const ConfirmModal = ({
  title,
  message,
  open,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  open: boolean;
  onClose(): void;
  onConfirm(): void;
}) => (
  <Modal
    title={title}
    open={open}
    onClose={onClose}
    danger
    footer={
      <>
        <button value="Submit" className="btn btn-danger" onClick={onConfirm}>
          Ya
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Tidak
        </button>
      </>
    }
  >
    <h4>{message}</h4>
  </Modal>
);

const NewsManager = ({ user }: { user: UserProfile }) => {
  const { api, notify } = useMalanghubRuntime();
  const theme = useThemeSnapshot();
  const admin = isAdmin(user);
  const myNews = useMyNews(api, true);
  const myDrafts = useMyDrafts(api, true);
  const allDrafts = useAllDrafts(api, admin);
  const [tableName, setTableName] = useState<NewsTableName>("Berita");
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<News | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rows =
    tableName === "Berita"
      ? myNews.data ?? []
      : tableName === "Antrian Berita"
        ? myDrafts.data ?? []
        : allDrafts.data ?? [];
  const loading =
    tableName === "Berita"
      ? myNews.isLoading
      : tableName === "Antrian Berita"
        ? myDrafts.isLoading
        : allDrafts.isLoading;

  return (
    <>
      <section id="news" className="collapse show mb-5">
        <section id="actions" className="py-4 mb-1">
          <div className="container">
            <div className="row">
              <div className="col-md-3 mb-2">
                <div className={`dropdown ${dropdownOpen ? "show" : ""}`}>
                  <button
                    className="btn btn-primary btn-block dropdown-toggle"
                    type="button"
                    aria-expanded={dropdownOpen}
                    onClick={() => setDropdownOpen((value) => !value)}
                  >
                    Berita
                  </button>
                  <div className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
                    <a href="#" className="dropdown-item" onClick={(event) => { event.preventDefault(); setTableName("Berita"); setDropdownOpen(false); }}>
                      Lihat Berita
                    </a>
                    <a href="#" className="dropdown-item" onClick={(event) => { event.preventDefault(); setModal("addNews"); setDropdownOpen(false); }}>
                      Tambah Berita
                    </a>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-2">
                <a href="#" className="btn btn-primary btn-block" onClick={(event) => { event.preventDefault(); setTableName("Antrian Berita"); }}>
                  Antrian Berita
                </a>
              </div>
              {admin && (
                <div className="col-md-3">
                  <a href="#" className="btn btn-primary btn-block" onClick={(event) => { event.preventDefault(); setTableName("Persetujuan Berita"); }}>
                    Persetujuan Berita
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
        <div className="container">
          <div className="row">
            <div className="col-md-9 mb-2">
              <div className={cardClass(theme)}>
                <div className={headerClass(theme)}>
                  <h4>{tableName}</h4>
                </div>
                <div className="table-responsive">
                  <table className={tableClass(theme)}>
                    <thead className={theme === "dark" ? "thead-dark" : "thead-light"}>
                      <tr>
                        <th>ID</th>
                        <th>Judul</th>
                        {(tableName === "Antrian Berita" || tableName === "Persetujuan Berita") && <th>Pesan Dari Admin</th>}
                        {(tableName === "Antrian Berita" || tableName === "Persetujuan Berita") && <th>Status</th>}
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7}><Spinner /></td></tr>
                      ) : (
                        rows.map((item, index) => (
                          <NewsDashboardRow
                            key={item._id}
                            news={item}
                            index={index}
                            tableName={tableName}
                            onEditDraft={() => { setSelectedDraft(item); setModal("editDraft"); }}
                            onDeleteDraft={() => { setSelectedDraft(item); setModal("deleteDraft"); }}
                            onApproveDraft={() => { setSelectedDraft(item); setModal("approveDraft"); }}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <NewsCounter title="Berita" count={myNews.data?.length ?? 0} loading={myNews.isLoading} onClick={() => setTableName("Berita")} />
              <NewsCounter title="Antrian Berita" count={myDrafts.data?.length ?? 0} loading={myDrafts.isLoading} onClick={() => setTableName("Antrian Berita")} />
              {admin && <NewsCounter title="Persetujuan Berita" count={allDrafts.data?.length ?? 0} loading={allDrafts.isLoading} onClick={() => setTableName("Persetujuan Berita")} />}
            </div>
          </div>
        </div>
      </section>
      <DraftFormModal mode="add" open={modal === "addNews"} onClose={() => setModal(null)} />
      <DraftFormModal mode="edit" draft={selectedDraft} open={modal === "editDraft"} onClose={() => setModal(null)} />
      <DeleteDraftModal draft={selectedDraft} open={modal === "deleteDraft"} onClose={() => setModal(null)} />
      <ApproveDraftModal draft={selectedDraft} open={modal === "approveDraft"} onClose={() => setModal(null)} />
    </>
  );
};

const NewsDashboardRow = ({
  news,
  index,
  tableName,
  onEditDraft,
  onDeleteDraft,
  onApproveDraft,
}: {
  news: News;
  index: number;
  tableName: NewsTableName;
  onEditDraft(): void;
  onDeleteDraft(): void;
  onApproveDraft(): void;
}) => {
  const { Link } = useAdapters();
  const isDraftTable = tableName !== "Berita";

  return (
    <tr>
      <td>{index + 1}</td>
      <td>{news.title}</td>
      {isDraftTable && <td>{news.message || "Silahkan Tunggu Konfirmasi dari Admin"}</td>}
      {isDraftTable && (
        <td>
          {news.status === "process" ? (
            <button className="btn btn-success btn-block">Sedang Diproses Admin</button>
          ) : (
            <button className="btn btn-danger btn-block">Admin Meminta Revisi</button>
          )}
        </td>
      )}
      <td>{formatDate(news.created_at)}</td>
      <td>{formatDate(news.updated_at ?? news.created_at)}</td>
      <td>
        <Link href={isDraftTable ? `/users/newsDrafts/${news.slug}` : `/news/${news.slug}`} className="btn btn-outline-primary m-1">
          <i className="fa fa-search-plus" aria-hidden="true" />
          {isDraftTable ? "Pratinjau" : "Lihat"}
        </Link>
        {tableName === "Antrian Berita" && (
          <>
            <button className="btn btn-primary m-1" onClick={onEditDraft}>
              <i className="fa fa-edit" aria-hidden="true" /> Edit
            </button>
            <button className="btn btn-danger m-1" onClick={onDeleteDraft}>
              <i className="fa fa-trash" aria-hidden="true" /> Hapus
            </button>
          </>
        )}
        {tableName === "Persetujuan Berita" && (
          <>
            <button className="btn btn-primary m-1" onClick={onApproveDraft}>
              <i className="fa fa-edit" aria-hidden="true" /> Persetujuan
            </button>
            <button className="btn btn-danger m-1" onClick={onDeleteDraft}>
              <i className="fa fa-trash" aria-hidden="true" /> Hapus
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

const NewsCounter = ({
  title,
  count,
  loading,
  onClick,
}: {
  title: string;
  count: number;
  loading?: boolean;
  onClick(): void;
}) => (
  <div className="card text-center bg-primary text-light mb-3">
    <div className="card-body">
      <h3 style={{ color: "#f8f9fa" }}>{title}</h3>
      <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
        <i className="fa fa-pencil-alt" aria-hidden="true" />{" "}
        {loading ? <Spinner /> : count}
      </h4>
      <a href="#" className="btn btn-outline-light btn-sm" onClick={(event) => { event.preventDefault(); onClick(); }}>
        Lihat
      </a>
    </div>
  </div>
);

const DraftFormModal = ({
  mode,
  draft,
  open,
  onClose,
}: {
  mode: "add" | "edit";
  draft?: News | null;
  open: boolean;
  onClose(): void;
}) => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const categories = useCategories(api);
  const tagsQuery = useTags(api);
  const createDraft = useCreateDraftMutation(api);
  const updateDraft = useUpdateDraftMutation(api);
  const [form, setForm] = useState({
    title: "",
    category: "default",
    content: "",
    tags: [] as string[],
  });
  const [mainImage, setMainImage] = useState<File | undefined>();
  const [mainImageName, setMainImageName] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      title: draft?.title ?? "",
      category: getNewsCategoryId(draft) || "default",
      content: draft?.content ?? "",
      tags: getNewsTagIds(draft),
    });
    setMainImage(undefined);
    setMainImageName("");
  }, [draft, open]);

  const toggleTag = (id: string, checked: boolean) => {
    setForm((value) => ({
      ...value,
      tags: checked
        ? [...value.tags, id]
        : value.tags.filter((tag) => tag !== id),
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !form.title ||
      form.category === "default" ||
      !form.content ||
      !form.tags.length ||
      (mode === "add" && !mainImage)
    ) {
      notify("Anda harus mengisi semua form yang diwajibkan (*)", "danger");
      return;
    }

    const data: CreateUpdateNewsDraftRequest = {
      title: form.title,
      category: form.category,
      content: form.content,
      tags: form.tags,
      mainImage,
      mainImageName,
    };

    const onError = (error: unknown) => {
      adapters.reportError?.(error);
      notify(error instanceof Error ? error.message : "Gagal menyimpan berita", "danger");
    };
    const onSuccess = () => {
      notify(mode === "add" ? "Berita Anda masuk Antrian Berita!" : "Berita Anda berhasil di update!", "success");
      onClose();
    };

    if (mode === "add") {
      createDraft.mutate(data, { onSuccess, onError });
    } else if (draft) {
      updateDraft.mutate({ id: getId(draft), data }, { onSuccess, onError });
    }
  };

  return (
    <Modal
      title={mode === "add" ? "Tambah Berita" : "Edit Berita"}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-primary" type="button" onClick={onClose}>Keluar</button>
          <button type="submit" form={`form-${mode}-news`} className="btn btn-primary" disabled={createDraft.isPending || updateDraft.isPending}>
            {createDraft.isPending || updateDraft.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      }
    >
      <form onSubmit={submit} id={`form-${mode}-news`}>
        <TextInput label="Judul *" value={form.title} placeholder="Judul" onChange={(title) => setForm({ ...form, title })} required />
        <div className="form-group">
          <label>Kategori *</label>
          <select className="form-control" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>
            <option value="default" disabled>Pilih Kategori</option>
            {categories.data?.map((category) => (
              <option key={getId(category)} value={getId(category)}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{mode === "add" ? "Gambar Utama Berita *" : "Gambar Utama Berita"}</label>
          <div className="custom-file">
            <input
              type="file"
              className="custom-file-input"
              id={`${mode}NewsImage`}
              accept="image/*"
              required={mode === "add"}
              onChange={(event) => {
                const file = event.target.files?.[0];
                setMainImage(file);
                setMainImageName(file?.name ?? "");
              }}
            />
            <label htmlFor={`${mode}NewsImage`} className="custom-file-label">
              {mainImageName || "Pilih File"}
            </label>
          </div>
          <small className="form-text text-muted">Max Size 1 MB</small>
        </div>
        <div className="form-group">
          <label>Konten *</label>
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </div>
        <div className="form-group">
          <h4>Pilih tag (harus memilih salah satu atau lebih) *</h4>
          {tagsQuery.data?.map((tag) => {
            const id = getId(tag);
            return (
              <div key={`${mode}-${id}`} className="custom-control custom-switch custom-control-inline">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id={`${mode}-${id}`}
                  checked={form.tags.includes(id)}
                  onChange={(event) => toggleTag(id, event.target.checked)}
                />
                <label className="custom-control-label" htmlFor={`${mode}-${id}`}>
                  {tag.name}
                </label>
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
};

const DeleteDraftModal = ({
  draft,
  open,
  onClose,
}: {
  draft?: News | null;
  open: boolean;
  onClose(): void;
}) => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const deleteDraft = useDeleteDraftMutation(api);

  const confirm = () => {
    if (!draft) return;
    deleteDraft.mutate(getId(draft), {
      onSuccess: () => {
        notify("Berita berhasil dihapus!", "success");
        onClose();
      },
      onError: (error) => {
        adapters.reportError?.(error);
        notify(error instanceof Error ? error.message : "Gagal menghapus berita", "danger");
      },
    });
  };

  return (
    <ConfirmModal
      title="Hapus Berita"
      message="Apakah anda yakin ingin menghapus berita?"
      open={open}
      onClose={onClose}
      onConfirm={confirm}
    />
  );
};

const ApproveDraftModal = ({
  draft,
  open,
  onClose,
}: {
  draft?: News | null;
  open: boolean;
  onClose(): void;
}) => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
  const approveDraft = useApproveDraftMutation(api);
  const [form, setForm] = useState({
    title: "",
    content: "",
    message: "",
    approved: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: draft?.title ?? "",
      content: draft?.content ?? "",
      message: "",
      approved: false,
    });
  }, [draft, open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || !form.title || !form.content || !form.message) {
      notify("Anda harus mengisi semua form yang diwajibkan (*)", "danger");
      return;
    }

    approveDraft.mutate(
      {
        id: getId(draft),
        data: form,
      },
      {
        onSuccess: () => {
          notify("Persetujuan berita berhasil disimpan", "success");
          onClose();
        },
        onError: (error) => {
          adapters.reportError?.(error);
          notify(error instanceof Error ? error.message : "Gagal menyimpan persetujuan", "danger");
        },
      }
    );
  };

  return (
    <Modal
      title="Persetujuan Berita"
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-primary" type="button" onClick={onClose}>Keluar</button>
          <button type="submit" form="form-approve-news" className="btn btn-primary" disabled={approveDraft.isPending}>
            Simpan
          </button>
        </>
      }
    >
      <form onSubmit={submit} id="form-approve-news">
        <TextInput label="Judul *" value={form.title} placeholder="Judul" onChange={(title) => setForm({ ...form, title })} required />
        <div className="form-group">
          <label>Konten *</label>
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </div>
        <div className="form-group">
          <label>Pesan *</label>
          <textarea className="form-control" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
        </div>
        <div className="form-group">
          <h4>Persetujuan *</h4>
          <div className="custom-control custom-switch custom-control-inline">
            <input
              type="checkbox"
              className="custom-control-input"
              id="approvement"
              checked={form.approved}
              onChange={(event) => setForm({ ...form, approved: event.target.checked })}
            />
            <label className="custom-control-label" htmlFor="approvement">
              Setuju
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const DashboardPage = () => {
  const { api, authStorage, authVersion, notify, refreshAuth, signOut } =
    useMalanghubRuntime();
  const adapters = useAdapters();
  const { Meta } = adapters;
  const [hasToken, setHasToken] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const currentUser = useCurrentUser(api, hasToken);
  const deleteAccount = useDeleteAccountMutation(api);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
      if (!token) adapters.navigate("/signin");
    });
  }, [adapters, authStorage, authVersion]);

  const onLogout = async () => {
    await signOut();
    setHasToken(false);
    refreshAuth();
    notify("Berhasil keluar", "success");
    adapters.navigate("/signin");
  };

  const onConfirmDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: async () => {
        setDeleteModalOpen(false);
        await signOut();
        setHasToken(false);
        refreshAuth();
        notify("Akun berhasil dihapus", "success");
        adapters.navigate("/");
      },
      onError: (error) => {
        adapters.reportError?.(error);
        notify(
          error instanceof Error ? error.message : "Gagal menghapus akun",
          "danger",
        );
      },
    });
  };

  if (currentUser.isLoading) return <Spinner />;

  return (
    <>
      <Meta
        title="Malanghub - Profil"
        description="Malanghub - Profil - Situs yang menyediakan informasi sekitar Malang Raya!"
        robots="noindex,nofollow"
      />
      <Breadcrumbs label="Profil" />
      <ProfileHero
        user={currentUser.data}
        onEdit={() => setProfileModalOpen(true)}
        onLogout={onLogout}
        onDeleteAccount={() => setDeleteModalOpen(true)}
      />
      {currentUser.data && <DashboardWorkbench user={currentUser.data} />}
      <EditProfileModal user={currentUser.data} open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={onConfirmDeleteAccount}
        isPending={deleteAccount.isPending}
      />
    </>
  );
};

const DraftContent = ({ html }: { html: string }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    contentRef.current?.querySelectorAll("*").forEach((node) => {
      node.removeAttribute("style");
    });
  }, [html]);

  return <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />;
};

const DraftArticleView = ({ news }: { news: News }) => {
  const { Link, Image } = useAdapters();
  const newsTags = getNewsTags(news);

  return (
    <div className="w3l-searchblock w3l-homeblock1 py-5">
      <div className="container py-lg-4 py-md-3">
        <div className="row">
          <div className="col-lg-8 most-recent">
            <div className="pb-5 w3l-homeblock1 text-center">
              <div className="container mt-md-3">
                <h3 className="blog-desc-big text-center mb-4">{news.title}</h3>
                <div className="blog-post-align">
                  <div className="blog-post-img embed-responsive embed-responsive-1by1">
                    <Link href={getAuthorHref(news)}>
                      <Image
                        src={news.user?.photo || DEFAULT_AVATAR_SRC}
                        alt={news.user?.name ?? "Penulis"}
                        className="rounded-circle img-fluid embed-responsive-item"
                        objectFit="cover"
                        fill
                      />
                    </Link>
                  </div>
                  <div className="blog-post-info">
                    <div className="author align-items-center mb-1">
                      <Link href={getAuthorHref(news)}>{news.user?.name ?? "Penulis"}</Link>{" "}
                      di <Link href={getCategoryHref(news)}>{getCategoryName(news)}</Link>
                    </div>
                    <ul className="blog-meta">
                      <li className="meta-item blog-lesson">
                        <span className="meta-value">{formatDateTime(news.created_at)}</span>
                      </li>
                      <li className="meta-item blog-students">
                        <span className="meta-value">{readingTime(news)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <section className="blog-post-main w3l-homeblock1">
              <div className="blog-content-inf pb-5">
                <div className="container pb-lg-4">
                  <div className="single-post-image">
                    <div className="post-content embed-responsive embed-responsive-4by3">
                      <Image
                        src={news.mainImage || "/malanghub-meta.png"}
                        alt={news.title}
                        className="radius-image img-fluid pb-5 embed-responsive-item"
                        objectFit="cover"
                        fill
                      />
                    </div>
                  </div>
                  <div className="single-post-content text-justify">
                    <DraftContent html={news.content} />

                    <div className="d-grid left-right mt-5 pb-md-5">
                      <div className="buttons-singles tags">
                        <h4>Tags :</h4>
                        {newsTags.map((tag) => (
                          <Link key={tag._id ?? tag.slug} href={`/newsTags/${tag.slug}`}>
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                      <div className="buttons-singles">
                        <h4>Share :</h4>
                        <a href="#blog-share">
                          <span className="fa fa-facebook" aria-hidden="true" />
                        </a>
                        <a href="#blog-share">
                          <span className="fa fa-twitter" aria-hidden="true" />
                        </a>
                      </div>
                    </div>

                    <div className="author-card mt-5">
                      <div className="row align-items-center">
                        <div className="col-sm-3 col-6">
                          <div className="embed-responsive embed-responsive-1by1">
                            <Image
                              src={news.user?.photo || DEFAULT_AVATAR_SRC}
                              alt={news.user?.name ?? "Penulis"}
                              className="rounded-circle img-fluid embed-responsive-item"
                              objectFit="cover"
                              fill
                            />
                          </div>
                        </div>
                        <div className="col-sm-9 mt-sm-0 mt-3">
                          <h3 className="mb-3 title">
                            {news.user?.name ?? "Penulis"}
                          </h3>
                          {news.user?.bio && <p>{news.user.bio}</p>}
                          <ul className="author-icons mt-4">
                            {news.user?.facebook && (
                              <li>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="facebook"
                                  href={getSocialHref(
                                    "facebook",
                                    news.user.facebook,
                                  )}
                                >
                                  <span className="fab fa-facebook" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                            {news.user?.twitter && (
                              <li>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="twitter"
                                  href={getSocialHref(
                                    "twitter",
                                    news.user.twitter,
                                  )}
                                >
                                  <span className="fab fa-twitter" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                            {news.user?.instagram && (
                              <li>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="instagram"
                                  href={getSocialHref(
                                    "instagram",
                                    news.user.instagram,
                                  )}
                                >
                                  <span className="fab fa-instagram" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                            {news.user?.linkedin && (
                              <li>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="linkedin"
                                  href={getSocialHref(
                                    "linkedin",
                                    news.user.linkedin,
                                  )}
                                >
                                  <span className="fab fa-linkedin" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                            {news.user?.tiktok && (
                              <li>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="tiktok"
                                  href={getSocialHref(
                                    "tiktok",
                                    news.user.tiktok,
                                  )}
                                >
                                  <span className="fab fa-tiktok" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-5">
                    <div className="col">
                      <Link href="/users" className="btn btn-outline-primary btn-block">
                        Kembali
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="col-lg-4 trending mt-lg-0 mt-5 mb-lg-5">
            <div className="pos-sticky">
              <h3 className="section-title-left">Mungkin Anda Tertarik </h3>
              <h1>Halaman Pratinjau Tidak Dapat Menampilkan Berita Terkait</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DraftPreviewPage = ({ slug }: { slug?: string }) => {
  const { api, authStorage, authVersion } = useMalanghubRuntime();
  const adapters = useAdapters();
  const { Meta } = adapters;
  const [hasToken, setHasToken] = useState(false);
  const draft = useDraftDetail(api, slug);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
      if (!token) adapters.navigate("/signin");
    });
  }, [adapters, authStorage, authVersion]);

  if (!hasToken || draft.isLoading) return <Spinner />;
  if (!draft.data) return <h1 className="malanghub-empty">Draft tidak ditemukan</h1>;

  return (
    <>
      <Meta
        title={`Malanghub - Antrian Berita - ${draft.data.title}`}
        description={excerpt(draft.data.content)}
        robots="noindex,nofollow"
      />
      <DraftBreadcrumbs label={draft.data.title} />
      <DraftArticleView news={draft.data} />
      <div
        className="display-ad"
        style={{ margin: "8px auto", display: "block", textAlign: "center" }}
      />
    </>
  );
};
