import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, LoadingBlock, buttonClass } from "@malanghub/ui";
import UserProfile, {
  UserProfileData,
  userNewsPath,
} from "../components/users/UserProfile";
import { fetchJson, pageCountOf } from "../utils/pagination";

type ProfileProps = Omit<UserProfileData, "user" | "setActiveLink">;

const USER_PATH = /^\/users\/([0-9a-f]{24})\/?$/;
const API_ADDRESS = process.env.NEXT_PUBLIC_API_ADDRESS;

// Only authors with published news get a prerendered profile, so Pages
// serves this page for every other /users/<id>. Load that profile in the
// browser instead of showing a 404.
async function loadProfile(id: string): Promise<ProfileProps> {
  const [trendingJson, userJson, listJson] = await Promise.all([
    fetchJson(
      `${API_ADDRESS}/api/news?page=1&sort=-views&limit=4&user=${id}&excerpt=1`,
    ),
    fetchJson(`${API_ADDRESS}/api/users/${id}`),
    fetchJson(`${API_ADDRESS}${userNewsPath(id)(1)}`),
  ]);
  return {
    userId: id,
    trendingNewsByUser: trendingJson.data ?? [],
    userProfile: userJson.data,
    userNews: listJson.data ?? [],
    pageCount: pageCountOf(listJson.meta),
  };
}

export default function Custom404() {
  // undefined: not a profile URL (or not checked yet); null: still loading.
  const [profile, setProfile] = useState<ProfileProps | null | undefined>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const id = USER_PATH.exec(window.location.pathname)?.[1];
    if (!id) {
      setChecked(true);
      return;
    }

    setProfile(null);
    loadProfile(id)
      .then(setProfile)
      .catch(() => setProfile(undefined))
      .finally(() => setChecked(true));
  }, []);

  if (profile) return <UserProfile {...profile} />;
  if (!checked || profile === null) {
    return (
      <Container className="py-16">
        <LoadingBlock />
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="font-heading text-7xl font-bold leading-none text-brand/30">
        404
      </span>
      <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
        404 - Halaman Tidak Ditemukan
      </h1>
      <Link href="/" className={buttonClass({ variant: "secondary" })}>
        Kembali ke Beranda
      </Link>
    </Container>
  );
}
