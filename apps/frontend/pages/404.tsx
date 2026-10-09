import Link from "next/link";
import { Container, buttonClass } from "@malanghub/ui";

export default function Custom404() {
  return (
    <Container className="tw:flex tw:min-h-[50vh] tw:flex-col tw:items-center tw:justify-center tw:gap-6 tw:py-16 tw:text-center">
      <span className="tw:font-heading tw:text-7xl tw:font-bold tw:leading-none tw:text-brand/30">
        404
      </span>
      <h1 className="tw:m-0 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:sm:text-3xl">
        404 - Halaman Tidak Ditemukan
      </h1>
      <Link href="/" className={buttonClass({ variant: "secondary" })}>
        Kembali ke Beranda
      </Link>
    </Container>
  );
}
