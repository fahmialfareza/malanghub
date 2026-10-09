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
  <fieldset className="m-0 mb-4 min-w-0 border-0 p-0">
    <legend className={cx(labelClass, "float-none w-auto p-0")}>
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
        className={cx(controlClass, "min-h-80 resize-y")}
        rows={14}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
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
            "advlist autolink lists link image charmap preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table code help wordcount",
            "directionality",
          ].join(" "),
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
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Input label="Instagram" placeholder="malanghub" {...field("instagram")} />
          <Input label="Facebook" placeholder="https://www.facebook.com/malanghub" {...field("facebook")} />
          <Input label="Twitter" placeholder="malanghub" {...field("twitter")} />
          <Input label="Tiktok" placeholder="malanghub" {...field("tiktok")} />
          <Input
            label="Linkedin"
            placeholder="https://linkedin.com/in/malanghub"
            wrapperClassName="sm:col-span-2"
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
    <div className="flex flex-col items-center px-2 pt-2 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-danger-soft text-2xl text-danger">
        <span className="fa fa-trash" aria-hidden="true" />
      </div>
      <h3 className="m-0 mb-3 font-heading text-lg font-bold text-fg">
        Hapus Akun Permanen?
      </h3>
      <p className="max-w-sm leading-relaxed text-body">
        Tindakan ini <strong className="text-fg">tidak dapat dibatalkan</strong>. Semua data
        profil, artikel, dan aktivitas kamu akan dihapus selamanya dan tidak
        bisa dipulihkan.
      </p>
    </div>
  </Modal>
);

const tabClass = (active: boolean) =>
  cx(
    "inline-flex h-10 items-center gap-2 rounded-lg border-0 px-4 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring",
    active
      ? "bg-surface text-brand shadow-card"
      : "bg-transparent text-body hover:text-fg",
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 flex items-center gap-3 font-heading text-2xl font-bold text-fg">
          <span className="fa fa-cog text-brand" aria-hidden="true" /> Dashboard
        </h2>
        <div
          className="inline-flex gap-1 self-start rounded-xl bg-surface-2 p-1"
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
    <div className="mb-4 flex flex-wrap gap-2">{toolbar}</div>
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{stats}</div>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader title={title} />
        {table}
      </Card>
    </div>
  </>
);

const RowActions = ({ children }: { children: React.ReactNode }) => (
  <div className="ml-auto flex max-w-[15rem] flex-wrap justify-end gap-2">{children}</div>
);

const TableMessage = ({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) => (
  <tr>
    <td colSpan={colSpan} className="py-8! text-center text-muted">
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
                  <span className="sr-only">Aksi</span>
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
                    <td className="font-semibold text-fg">{category.name}</td>
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
                  <span className="sr-only">Aksi</span>
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
                    <td className="font-semibold text-fg">{tag.name}</td>
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
      "flex items-center gap-4 p-5",
      active && "border-brand ring-2 ring-brand-soft",
    )}
  >
    <span
      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xl text-brand"
      aria-hidden="true"
    >
      <span className={`fa ${icon}`} />
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="m-0 truncate text-sm font-semibold text-muted">
        {title}
      </h3>
      <div className="font-heading text-3xl font-bold leading-tight text-fg">
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
          wrapperClassName="mb-0"
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
    <p className="text-base text-body">{message}</p>
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
                  <span className="sr-only">Aksi</span>
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
      <td className="min-w-48 font-semibold text-fg">{news.title}</td>
      {isDraftTable && (
        <td className="min-w-48">
          {news.message || "Silahkan Tunggu Konfirmasi dari Admin"}
        </td>
      )}
      {isDraftTable && (
        <td>
          {news.status === "process" ? (
            <Badge tone="success" className="whitespace-nowrap">
              Sedang Diproses Admin
            </Badge>
          ) : (
            <Badge tone="danger" className="whitespace-nowrap">
              Admin Meminta Revisi
            </Badge>
          )}
        </td>
      )}
      <td className="whitespace-nowrap">{formatDate(news.created_at)}</td>
      <td className="whitespace-nowrap">{formatDate(news.updated_at ?? news.created_at)}</td>
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
  "mb-0 rounded-full border border-line bg-surface py-1.5 pr-3.5 pl-3 has-checked:border-brand has-checked:bg-brand-soft";

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
        <div className="grid gap-x-4 md:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
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
              className="text-danger! hover:bg-danger-soft!"
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
      <Container className="py-10">
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
            className={buttonClass({ variant: "secondary", block: true, className: "mt-10" })}
          >
            Kembali
          </Link>
        }
        asideTitle="Mungkin Anda Tertarik"
        aside={
          <p className="rounded-xl border border-dashed border-line-strong p-5 text-sm text-muted">
            Halaman Pratinjau Tidak Dapat Menampilkan Berita Terkait
          </p>
        }
      />
      <div className="display-ad mx-auto my-2 block text-center" />
    </>
  );
};
