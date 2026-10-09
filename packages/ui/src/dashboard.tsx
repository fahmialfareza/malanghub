import React, { useEffect, useRef, useState } from "react";
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
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Container,
  Dropdown,
  FileInput,
  Input,
  Modal,
  Select,
  Spinner,
  Table,
  Textarea,
  buttonClass,
  controlClass,
  cx,
  labelClass,
  useTheme,
} from "./primitives";
import {
  ArticleView,
  EmptyState,
  LoadingState,
  PageBreadcrumbs,
  PageSection,
  ProfileHeader,
} from "./content";
import { excerpt, formatDate } from "./utils";

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

/** Group label for controls that are not a single input (editor, toggles). */
const FieldGroup = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <fieldset className="tw:m-0 tw:mb-4 tw:min-w-0 tw:border-0 tw:p-0">
    <legend className={cx(labelClass, "tw:float-none tw:w-auto tw:p-0")}>
      {label}
    </legend>
    {children}
  </fieldset>
);

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange(value: string): void;
}) => {
  const adapters = useAdapters();
  const { theme } = useTheme();
  const editorIdRef = useRef(
    `malanghub-richtext-${Math.random().toString(36).slice(2)}`,
  );

  if (isNativeMobileApp() || !adapters.tinyApiKey) {
    return (
      <textarea
        aria-label="Konten"
        className={cx(controlClass, "tw:min-h-80 tw:resize-y")}
        rows={14}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="tw:overflow-hidden tw:rounded-lg tw:border tw:border-line">
      <Editor
        key={theme}
        id={`${editorIdRef.current}-${theme}`}
        apiKey={adapters.tinyApiKey}
        value={value}
        init={{
          height: 500,
          menubar: true,
          skin: theme === "dark" ? "oxide-dark" : "oxide",
          content_css: theme === "dark" ? "dark" : "default",
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
    </div>
  );
};

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

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: event.target.value }),
  });

  return (
    <Modal
      title="Edit Profil"
      open={open}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form="form-update-profile" loading={updateProfile.isPending}>
            {updateProfile.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} id="form-update-profile">
        <Input label="Nama *" placeholder="Nama" required {...field("name")} />
        <FileInput
          label="Update Foto Profil"
          hint={photoName ? `${photoName} · Max Size 1 MB` : "Max Size 1 MB"}
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPhoto(file);
            setPhotoName(file?.name ?? "");
          }}
        />
        <Input label="Motto" placeholder="Motto" {...field("motto")} />
        <Textarea
          label="Bio"
          placeholder="Bio..."
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
        />
        <div className="tw:grid tw:gap-x-4 tw:sm:grid-cols-2">
          <Input label="Instagram" placeholder="malanghub" {...field("instagram")} />
          <Input label="Facebook" placeholder="https://www.facebook.com/malanghub" {...field("facebook")} />
          <Input label="Twitter" placeholder="malanghub" {...field("twitter")} />
          <Input label="Tiktok" placeholder="malanghub" {...field("tiktok")} />
          <Input
            label="Linkedin"
            placeholder="https://linkedin.com/in/malanghub"
            wrapperClassName="tw:sm:col-span-2"
            {...field("linkedin")}
          />
        </div>
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
    size="sm"
    danger
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isPending}>
          {!isPending && <span className="fa fa-trash" aria-hidden="true" />}
          {isPending ? "Menghapus..." : "Ya, Hapus Akun"}
        </Button>
      </>
    }
  >
    <div className="tw:flex tw:flex-col tw:items-center tw:px-2 tw:pt-2 tw:text-center">
      <div className="tw:mb-5 tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-danger-soft tw:text-2xl tw:text-danger">
        <span className="fa fa-trash" aria-hidden="true" />
      </div>
      <h3 className="tw:m-0 tw:mb-3 tw:font-heading tw:text-lg tw:font-bold tw:text-fg">
        Hapus Akun Permanen?
      </h3>
      <p className="tw:max-w-sm tw:leading-relaxed tw:text-body">
        Tindakan ini <strong className="tw:text-fg">tidak dapat dibatalkan</strong>. Semua data
        profil, artikel, dan aktivitas kamu akan dihapus selamanya dan tidak
        bisa dipulihkan.
      </p>
    </div>
  </Modal>
);

const tabClass = (active: boolean) =>
  cx(
    "tw:inline-flex tw:h-10 tw:items-center tw:gap-2 tw:rounded-lg tw:border-0 tw:px-4 tw:text-sm tw:font-semibold tw:transition-colors tw:cursor-pointer tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring",
    active
      ? "tw:bg-surface tw:text-brand tw:shadow-card"
      : "tw:bg-transparent tw:text-body tw:hover:text-fg",
  );

const DashboardWorkbench = ({ user }: { user: UserProfile }) => {
  const admin = isAdmin(user);
  const [activeSection, setActiveSection] = useState<DashboardSection>(
    admin ? "category" : "news"
  );

  useEffect(() => {
    setActiveSection(admin ? "category" : "news");
  }, [admin]);

  const sections: Array<{ key: DashboardSection; label: string; icon: string }> = [
    ...(admin
      ? [
          { key: "category" as const, label: "Kategori", icon: "fa-list-alt" },
          { key: "tag" as const, label: "Tag", icon: "fa-tag" },
        ]
      : []),
    { key: "news", label: "Berita", icon: "fa-newspaper-o" },
  ];

  return (
    <PageSection>
      <div className="tw:mb-6 tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
        <h2 className="tw:m-0 tw:flex tw:items-center tw:gap-3 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg">
          <span className="fa fa-cog tw:text-brand" aria-hidden="true" /> Dashboard
        </h2>
        <div
          className="tw:inline-flex tw:gap-1 tw:self-start tw:rounded-xl tw:bg-surface-2 tw:p-1"
          role="group"
          aria-label="Bagian dashboard"
        >
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={tabClass(activeSection === section.key)}
              aria-pressed={activeSection === section.key}
              onClick={() => setActiveSection(section.key)}
            >
              <span className={`fa ${section.icon}`} aria-hidden="true" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {admin && activeSection === "category" && <CategoryManager />}
      {admin && activeSection === "tag" && <TagManager />}
      {activeSection === "news" && <NewsManager user={user} />}
    </PageSection>
  );
};

const ManagerLayout = ({
  toolbar,
  title,
  table,
  stats,
}: {
  toolbar: React.ReactNode;
  title: string;
  table: React.ReactNode;
  stats: React.ReactNode;
}) => (
  <>
    <div className="tw:mb-4 tw:flex tw:flex-wrap tw:gap-2">{toolbar}</div>
    <div className="tw:grid tw:gap-6 tw:lg:grid-cols-4">
      <Card className="tw:min-w-0 tw:overflow-hidden tw:lg:col-span-3">
        <CardHeader title={title} />
        {table}
      </Card>
      <div className="tw:flex tw:flex-col tw:gap-4">{stats}</div>
    </div>
  </>
);

const RowActions = ({ children }: { children: React.ReactNode }) => (
  <div className="tw:flex tw:flex-wrap tw:justify-end tw:gap-2">{children}</div>
);

const TableMessage = ({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) => (
  <tr>
    <td colSpan={colSpan} className="tw:py-8! tw:text-center tw:text-muted">
      {children}
    </td>
  </tr>
);

const CategoryManager = () => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
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
      <ManagerLayout
        toolbar={
          <Button onClick={() => setModal("addCategory")}>
            <span className="fa fa-plus" aria-hidden="true" /> Tambah Kategori
          </Button>
        }
        title="Kategori (Berita)"
        table={
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Kategori</th>
                <th>Dibuat</th>
                <th>Diperbaharui</th>
                <th>
                  <span className="tw:sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.isLoading ? (
                <TableMessage colSpan={5}>
                  <Spinner label="Memuat..." />
                </TableMessage>
              ) : (
                categories.data?.map((category, index) => (
                  <tr key={getId(category)}>
                    <td>{index + 1}</td>
                    <td className="tw:font-semibold tw:text-fg">{category.name}</td>
                    <td>{formatDate(category.created_at)}</td>
                    <td>{formatDate(category.updated_at ?? category.created_at)}</td>
                    <td>
                      <RowActions>
                        <Button size="sm" variant="secondary" onClick={() => { setSelected(category); setModal("editCategory"); }}>
                          <span className="fa fa-edit" aria-hidden="true" /> Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setSelected(category); setModal("deleteCategory"); }}>
                          <span className="fa fa-trash" aria-hidden="true" /> Hapus
                        </Button>
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        }
        stats={
          <StatCard title="Kategori" icon="fa-list-alt" count={categories.data?.length ?? 0} loading={categories.isLoading} />
        }
      />
      <TaxonomyModal title="Tambah Kategori (Berita)" open={modal === "addCategory"} onClose={() => setModal(null)} onSubmit={(name) => mutate("create", name)} />
      <TaxonomyModal title="Edit Kategori (Berita)" open={modal === "editCategory"} initialName={selected?.name} onClose={() => setModal(null)} onSubmit={(name) => mutate("update", name, selected)} />
      <ConfirmModal title="Hapus Kategori (Berita)" message="Apakah anda yakin ingin menghapus kategori?" open={modal === "deleteCategory"} onClose={() => setModal(null)} onConfirm={() => mutate("delete", undefined, selected)} />
    </>
  );
};

const TagManager = () => {
  const { api, notify } = useMalanghubRuntime();
  const adapters = useAdapters();
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
      <ManagerLayout
        toolbar={
          <Button onClick={() => setModal("addTag")}>
            <span className="fa fa-plus" aria-hidden="true" /> Tambah Tag
          </Button>
        }
        title="Tag (Berita)"
        table={
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Tag</th>
                <th>Dibuat</th>
                <th>Diperbaharui</th>
                <th>
                  <span className="tw:sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.isLoading ? (
                <TableMessage colSpan={5}>
                  <Spinner label="Memuat..." />
                </TableMessage>
              ) : (
                tags.data?.map((tag, index) => (
                  <tr key={getId(tag)}>
                    <td>{index + 1}</td>
                    <td className="tw:font-semibold tw:text-fg">{tag.name}</td>
                    <td>{formatDate(tag.created_at)}</td>
                    <td>{formatDate(tag.updated_at ?? tag.created_at)}</td>
                    <td>
                      <RowActions>
                        <Button size="sm" variant="secondary" onClick={() => { setSelected(tag); setModal("editTag"); }}>
                          <span className="fa fa-edit" aria-hidden="true" /> Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setSelected(tag); setModal("deleteTag"); }}>
                          <span className="fa fa-trash" aria-hidden="true" /> Hapus
                        </Button>
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        }
        stats={
          <StatCard title="Tag" icon="fa-tag" count={tags.data?.length ?? 0} loading={tags.isLoading} />
        }
      />
      <TaxonomyModal title="Tambah Tag (Berita)" open={modal === "addTag"} onClose={() => setModal(null)} onSubmit={(name) => mutate("create", name)} />
      <TaxonomyModal title="Edit Tag (Berita)" open={modal === "editTag"} initialName={selected?.name} onClose={() => setModal(null)} onSubmit={(name) => mutate("update", name, selected)} />
      <ConfirmModal title="Hapus Tag (Berita)" message="Apakah anda yakin ingin menghapus tag?" open={modal === "deleteTag"} onClose={() => setModal(null)} onConfirm={() => mutate("delete", undefined, selected)} />
    </>
  );
};

const StatCard = ({
  title,
  icon,
  count,
  loading,
  active,
  onClick,
}: {
  title: string;
  icon: string;
  count: number;
  loading?: boolean;
  active?: boolean;
  onClick?(): void;
}) => (
  <Card
    className={cx(
      "tw:flex tw:items-center tw:gap-4 tw:p-5",
      active && "tw:border-brand tw:ring-2 tw:ring-brand-soft",
    )}
  >
    <span
      className="tw:flex tw:size-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-brand-soft tw:text-xl tw:text-brand"
      aria-hidden="true"
    >
      <span className={`fa ${icon}`} />
    </span>
    <div className="tw:min-w-0 tw:flex-1">
      <h3 className="tw:m-0 tw:truncate tw:text-sm tw:font-semibold tw:text-muted">
        {title}
      </h3>
      <div className="tw:font-heading tw:text-3xl tw:font-bold tw:leading-tight tw:text-fg">
        {loading ? <Spinner size="sm" /> : count}
      </div>
    </div>
    {onClick && (
      <Button size="sm" variant="ghost" onClick={onClick} aria-label={`Lihat ${title}`}>
        Lihat
      </Button>
    )}
  </Card>
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
          <Button variant="secondary" onClick={onClose}>
            Keluar
          </Button>
          <Button type="submit" form={`form-${title}`}>
            Simpan
          </Button>
        </>
      }
    >
      <form id={`form-${title}`} onSubmit={(event) => { event.preventDefault(); onSubmit(name); }}>
        <Input
          label="Nama *"
          wrapperClassName="tw:mb-0"
          value={name}
          placeholder={title.includes("Tag") ? "Nama Tag" : "Nama Kategori"}
          onChange={(event) => setName(event.target.value)}
          required
        />
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
    size="sm"
    danger
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Tidak
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Ya
        </Button>
      </>
    }
  >
    <p className="tw:text-base tw:text-body">{message}</p>
  </Modal>
);

const NewsManager = ({ user }: { user: UserProfile }) => {
  const { api } = useMalanghubRuntime();
  const { Link } = useAdapters();
  const admin = isAdmin(user);
  const myNews = useMyNews(api, true);
  const myDrafts = useMyDrafts(api, true);
  const allDrafts = useAllDrafts(api, admin);
  const [tableName, setTableName] = useState<NewsTableName>("Berita");
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<News | null>(null);

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
  const isDraftTable = tableName !== "Berita";
  const columnCount = isDraftTable ? 7 : 5;

  return (
    <>
      <ManagerLayout
        toolbar={
          <>
            <Dropdown
              label={
                <>
                  Berita <span className="fa fa-angle-down" aria-hidden="true" />
                </>
              }
              buttonClassName={buttonClass({
                variant: tableName === "Berita" ? "primary" : "secondary",
              })}
              items={[
                { key: "view", label: "Lihat Berita", onSelect: () => setTableName("Berita") },
                { key: "add", label: "Tambah Berita", onSelect: () => setModal("addNews") },
              ]}
              renderLink={({ href, className, children }) => (
                <Link href={href} className={className}>
                  {children}
                </Link>
              )}
            />
            <Button
              variant={tableName === "Antrian Berita" ? "primary" : "secondary"}
              onClick={() => setTableName("Antrian Berita")}
            >
              Antrian Berita
            </Button>
            {admin && (
              <Button
                variant={tableName === "Persetujuan Berita" ? "primary" : "secondary"}
                onClick={() => setTableName("Persetujuan Berita")}
              >
                Persetujuan Berita
              </Button>
            )}
          </>
        }
        title={tableName}
        table={
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Judul</th>
                {isDraftTable && <th>Pesan Dari Admin</th>}
                {isDraftTable && <th>Status</th>}
                <th>Dibuat</th>
                <th>Diperbaharui</th>
                <th>
                  <span className="tw:sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableMessage colSpan={columnCount}>
                  <Spinner label="Memuat..." />
                </TableMessage>
              ) : !rows.length ? (
                <TableMessage colSpan={columnCount}>Belum ada data.</TableMessage>
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
          </Table>
        }
        stats={
          <>
            <StatCard title="Berita" icon="fa-newspaper-o" count={myNews.data?.length ?? 0} loading={myNews.isLoading} active={tableName === "Berita"} onClick={() => setTableName("Berita")} />
            <StatCard title="Antrian Berita" icon="fa-hourglass-half" count={myDrafts.data?.length ?? 0} loading={myDrafts.isLoading} active={tableName === "Antrian Berita"} onClick={() => setTableName("Antrian Berita")} />
            {admin && <StatCard title="Persetujuan Berita" icon="fa-check-square-o" count={allDrafts.data?.length ?? 0} loading={allDrafts.isLoading} active={tableName === "Persetujuan Berita"} onClick={() => setTableName("Persetujuan Berita")} />}
          </>
        }
      />
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
      <td className="tw:min-w-48 tw:font-semibold tw:text-fg">{news.title}</td>
      {isDraftTable && (
        <td className="tw:min-w-48">
          {news.message || "Silahkan Tunggu Konfirmasi dari Admin"}
        </td>
      )}
      {isDraftTable && (
        <td>
          {news.status === "process" ? (
            <Badge tone="success" className="tw:whitespace-nowrap">
              Sedang Diproses Admin
            </Badge>
          ) : (
            <Badge tone="danger" className="tw:whitespace-nowrap">
              Admin Meminta Revisi
            </Badge>
          )}
        </td>
      )}
      <td className="tw:whitespace-nowrap">{formatDate(news.created_at)}</td>
      <td className="tw:whitespace-nowrap">{formatDate(news.updated_at ?? news.created_at)}</td>
      <td>
        <RowActions>
          <Link
            href={isDraftTable ? `/users/newsDrafts/${news.slug}` : `/news/${news.slug}`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            <span className="fa fa-search-plus" aria-hidden="true" />
            {isDraftTable ? "Pratinjau" : "Lihat"}
          </Link>
          {tableName === "Antrian Berita" && (
            <>
              <Button size="sm" onClick={onEditDraft}>
                <span className="fa fa-edit" aria-hidden="true" /> Edit
              </Button>
              <Button size="sm" variant="danger" onClick={onDeleteDraft}>
                <span className="fa fa-trash" aria-hidden="true" /> Hapus
              </Button>
            </>
          )}
          {tableName === "Persetujuan Berita" && (
            <>
              <Button size="sm" onClick={onApproveDraft}>
                <span className="fa fa-edit" aria-hidden="true" /> Persetujuan
              </Button>
              <Button size="sm" variant="danger" onClick={onDeleteDraft}>
                <span className="fa fa-trash" aria-hidden="true" /> Hapus
              </Button>
            </>
          )}
        </RowActions>
      </td>
    </tr>
  );
};

const tagChipClass =
  "tw:mb-0 tw:rounded-full tw:border tw:border-line tw:bg-surface tw:py-1.5 tw:pr-3.5 tw:pl-3 tw:has-checked:border-brand tw:has-checked:bg-brand-soft";

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

  const saving = createDraft.isPending || updateDraft.isPending;

  return (
    <Modal
      title={mode === "add" ? "Tambah Berita" : "Edit Berita"}
      open={open}
      onClose={onClose}
      size="xl"
      allowExternalPopups
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keluar</Button>
          <Button type="submit" form={`form-${mode}-news`} loading={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} id={`form-${mode}-news`}>
        <Input
          label="Judul *"
          value={form.title}
          placeholder="Judul"
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <div className="tw:grid tw:gap-x-4 tw:md:grid-cols-2">
          <Select
            label="Kategori *"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            required
          >
            <option value="default" disabled>Pilih Kategori</option>
            {categories.data?.map((category) => (
              <option key={getId(category)} value={getId(category)}>
                {category.name}
              </option>
            ))}
          </Select>
          <FileInput
            id={`${mode}NewsImage`}
            label={mode === "add" ? "Gambar Utama Berita *" : "Gambar Utama Berita"}
            hint={mainImageName ? `${mainImageName} · Max Size 1 MB` : "Max Size 1 MB"}
            accept="image/*"
            required={mode === "add"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setMainImage(file);
              setMainImageName(file?.name ?? "");
            }}
          />
        </div>
        <FieldGroup label="Konten *">
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </FieldGroup>
        <FieldGroup label="Pilih tag (harus memilih salah satu atau lebih) *">
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {tagsQuery.data?.map((tag) => {
              const id = getId(tag);
              return (
                <Checkbox
                  key={`${mode}-${id}`}
                  id={`${mode}-${id}`}
                  label={tag.name}
                  wrapperClassName={tagChipClass}
                  checked={form.tags.includes(id)}
                  onChange={(event) => toggleTag(id, event.target.checked)}
                />
              );
            })}
          </div>
        </FieldGroup>
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
      size="xl"
      allowExternalPopups
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keluar</Button>
          <Button type="submit" form="form-approve-news" loading={approveDraft.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={submit} id="form-approve-news">
        <Input
          label="Judul *"
          value={form.title}
          placeholder="Judul"
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <FieldGroup label="Konten *">
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </FieldGroup>
        <Textarea
          label="Pesan *"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
        />
        <FieldGroup label="Persetujuan *">
          <Checkbox
            id="approvement"
            label="Setuju"
            wrapperClassName={tagChipClass}
            checked={form.approved}
            onChange={(event) => setForm({ ...form, approved: event.target.checked })}
          />
        </FieldGroup>
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

  if (currentUser.isLoading) return <LoadingState />;

  return (
    <>
      <Meta
        title="Malanghub - Profil"
        description="Malanghub - Profil - Situs yang menyediakan informasi sekitar Malang Raya!"
        robots="noindex,nofollow"
      />
      <PageBreadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Profil" }]} />
      <ProfileHeader
        user={currentUser.data}
        greeting
        actions={
          <>
            <Button onClick={() => setProfileModalOpen(true)}>
              <span className="fa fa-edit" aria-hidden="true" />
              Edit Profil
            </Button>
            <Button variant="secondary" onClick={() => void onLogout()}>
              <span className="fa fa-sign-out" aria-hidden="true" />
              Keluar
            </Button>
            <Button
              variant="ghost"
              className="tw:text-danger! tw:hover:bg-danger-soft!"
              onClick={() => setDeleteModalOpen(true)}
            >
              <span className="fa fa-trash" aria-hidden="true" />
              Hapus Akun
            </Button>
          </>
        }
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

export const DraftPreviewPage = ({ slug }: { slug?: string }) => {
  const { api, authStorage, authVersion } = useMalanghubRuntime();
  const adapters = useAdapters();
  const { Meta, Link } = adapters;
  const [hasToken, setHasToken] = useState(false);
  const draft = useDraftDetail(api, slug);

  useEffect(() => {
    void Promise.resolve(authStorage.getToken()).then((token) => {
      setHasToken(Boolean(token));
      if (!token) adapters.navigate("/signin");
    });
  }, [adapters, authStorage, authVersion]);

  if (!hasToken || draft.isLoading) return <LoadingState />;
  if (!draft.data) {
    return (
      <Container className="tw:py-10">
        <EmptyState>Draft tidak ditemukan</EmptyState>
      </Container>
    );
  }

  return (
    <>
      <Meta
        title={`Malanghub - Antrian Berita - ${draft.data.title}`}
        description={excerpt(draft.data.content)}
        robots="noindex,nofollow"
      />
      <PageBreadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Antrian Berita" },
          { label: draft.data.title },
        ]}
      />
      <ArticleView
        news={draft.data}
        content={<DraftContent html={draft.data.content} />}
        tagsLabel="Tags :"
        shareLabel="Share :"
        shareLinks={[
          { icon: "fa-facebook", label: "Facebook", href: "#blog-share" },
          { icon: "fa-twitter", label: "Twitter", href: "#blog-share" },
        ]}
        footer={
          <Link
            href="/users"
            className={buttonClass({ variant: "secondary", block: true, className: "tw:mt-10" })}
          >
            Kembali
          </Link>
        }
        asideTitle="Mungkin Anda Tertarik"
        aside={
          <p className="tw:rounded-xl tw:border tw:border-dashed tw:border-line-strong tw:p-5 tw:text-sm tw:text-muted">
            Halaman Pratinjau Tidak Dapat Menampilkan Berita Terkait
          </p>
        }
      />
      <div className="display-ad tw:mx-auto tw:my-2 tw:block tw:text-center" />
    </>
  );
};
