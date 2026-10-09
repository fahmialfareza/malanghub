import { connect } from "react-redux";
import Link from "next/link";
import { Container, buttonClass } from "@malanghub/ui";

function Offline() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <span
        className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-3xl text-muted"
        aria-hidden="true"
      >
        <span className="fa fa-wifi" />
      </span>
      <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
        Kamu sedang offline!
      </h1>
      <Link href="/" className={buttonClass({ variant: "secondary" })}>
        Kembali ke Beranda
      </Link>
    </Container>
  );
}

export default connect(null, {})(Offline);
