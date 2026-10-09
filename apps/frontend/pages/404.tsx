import Link from "next/link";
import { Container, buttonClass } from "@malanghub/ui";

export default function Custom404() {
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
