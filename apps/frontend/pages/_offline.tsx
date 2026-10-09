import { connect } from "react-redux";
import Link from "next/link";
import { Container, buttonClass } from "@malanghub/ui";

function Offline() {
  return (
    <Container className="tw:flex tw:min-h-[50vh] tw:flex-col tw:items-center tw:justify-center tw:gap-6 tw:py-16 tw:text-center">
      <span
        className="fa fa-wifi tw:flex tw:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-surface-2 tw:text-3xl tw:text-muted"
        aria-hidden="true"
      ></span>
      <h1 className="tw:m-0 tw:font-heading tw:text-2xl tw:font-bold tw:text-fg tw:sm:text-3xl">
        Kamu sedang offline!
      </h1>
      <Link href="/" className={buttonClass({ variant: "secondary" })}>
        Kembali ke Beranda
      </Link>
    </Container>
  );
}

export default connect(null, {})(Offline);
