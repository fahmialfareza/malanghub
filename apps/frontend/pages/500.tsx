import { Container } from "@malanghub/ui";

export default function Custom500() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="font-heading text-7xl font-bold leading-none text-danger/30">
        500
      </span>
      <h1 className="m-0 font-heading text-2xl font-bold text-fg sm:text-3xl">
        500 - Kesalahan Server
      </h1>
    </Container>
  );
}
