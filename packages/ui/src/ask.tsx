import React, { useEffect, useRef, useState } from "react";
import { ApiError, type AiSource, useAskAiMutation } from "@malanghub/core";
import { useAdapters, useSearchParam } from "./adapters";
import { useMalanghubRuntime } from "./providers";
import { PageBreadcrumbs, PageSection } from "./content";
import { cx } from "./primitives";
import { siteUrl } from "./utils";

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;

const EXAMPLE_QUESTIONS = [
  "Apa berita terbaru di Kota Batu?",
  "Ada acara apa saja di Malang akhir-akhir ini?",
  "Bagaimana kondisi lalu lintas di Kota Malang?",
  "Rekomendasi wisata di Kabupaten Malang?",
];

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";

/** Brand-to-success gradient used by the hero icon and the answer avatar. */
const aiGradientClass =
  "bg-linear-135 from-brand to-[color-mix(in_srgb,var(--mh-primary)_55%,var(--mh-success))] text-brand-fg";

const softBadgeClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-soft font-bold text-brand";

const actionClass = cx(
  "inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-3 py-1.5 text-sm text-muted transition-colors hover:bg-brand-soft hover:text-brand",
  focusRing,
);

// Some article titles are written in ALL CAPS; show them in title case so the
// source list is easier to scan.
const readableTitle = (title: string) => {
  const letters = title.replace(/[^A-Za-z]/g, "");
  if (letters.length < 8 || letters !== letters.toUpperCase()) {
    return title;
  }
  return title
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
};

const formatSourceDate = (date: string) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const errorMessage = (error: unknown) =>
  error instanceof ApiError && error.message
    ? error.message
    : "Terjadi kesalahan, silakan coba lagi.";

const isNativeMobile = () =>
  typeof document !== "undefined" &&
  document.body.classList.contains("malanghub-native-mobile");

// Turns "[1]" citations in a line of the answer into links to the source
// article and drops stray Markdown emphasis.
const AnswerLine = ({ line, sources }: { line: string; sources: AiSource[] }) => {
  const { Link } = useAdapters();

  return (
    <>
      {line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .split(/(\[\d+\])/g)
        .map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          const source = match ? sources[Number(match[1]) - 1] : undefined;
          if (!match || !source) {
            return part;
          }
          return (
            <span key={i} title={readableTitle(source.title)}>
              <Link
                href={`/news/${source.slug}`}
                className={cx(
                  softBadgeClass,
                  "mx-0.5 h-[1.35rem] min-w-[1.35rem] rounded-md px-1 align-[0.15em] text-xs no-underline transition-colors hover:bg-brand hover:text-brand-fg",
                  focusRing,
                )}
              >
                {match[1]}
              </Link>
            </span>
          );
        })}
    </>
  );
};

export const AskPage = () => {
  const { Link, Meta, reportError } = useAdapters();
  const { api } = useMalanghubRuntime();
  const ask = useAskAiMutation(api);
  const initialQuestion = useSearchParam("q");
  const [question, setQuestion] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const askedPrefill = useRef<string | null>(null);

  const loading = ask.isPending;
  const result = ask.data;
  const askedQuestion = ask.variables;
  const trimmed = question.trim();
  const canSubmit =
    !loading && trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const submit = (q: string) => {
    setCopied(false);
    ask.mutate(q, {
      onError: (error) => {
        // rate limits and validation errors are expected; report the rest
        if (!(error instanceof ApiError && error.status < 500)) {
          reportError?.(error);
        }
      },
    });
  };

  // Questions handed over from elsewhere (e.g. the native search sheet) arrive
  // as ?q= and are asked right away.
  useEffect(() => {
    const q = initialQuestion?.trim() ?? "";
    if (!q || askedPrefill.current === q) return;
    askedPrefill.current = q;
    setQuestion(q);
    if (q.length >= MIN_LENGTH && q.length <= MAX_LENGTH) {
      submit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  // Focus the box on desktop; on phones that would pop the keyboard over the page.
  useEffect(() => {
    if (!initialQuestion && !isNativeMobile()) {
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // grow the textarea with its content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [question]);

  // bring the answer area into view when a question is sent
  useEffect(() => {
    if (loading) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      submit(trimmed);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a new line; ignore while composing (IME)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      onSubmit(e);
    }
  };

  const askExample = (q: string) => {
    setQuestion(q);
    submit(q);
  };

  const askAnother = () => {
    setQuestion("");
    ask.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    textareaRef.current?.focus();
  };

  const copyAnswer = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable (e.g. insecure context); ignore
    }
  };

  const answerLines = result?.answer
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <>
      <Meta
        title="Tanya Malanghub AI"
        description="Tanya Malanghub AI - Tanyakan apa saja seputar Malang Raya, dijawab berdasarkan berita Malanghub. Gratis untuk semua!"
        canonical={`${siteUrl}/ask`}
        image={`${siteUrl}/malanghub-meta.png`}
      />
      <PageBreadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Tanya Malanghub AI" }]}
      />
      <PageSection className="lg:py-14">
        <div className="mx-auto max-w-[760px]">
          <header className="mb-7 text-center">
            <div
              className={cx(
                aiGradientClass,
                "mb-4 inline-flex size-14 items-center justify-center rounded-2xl text-2xl shadow-[0_8px_24px_color-mix(in_srgb,var(--mh-primary)_35%,transparent)]",
              )}
              aria-hidden="true"
            >
              <span className="fa fa-comments" />
            </div>
            <h1 className="mb-2 font-heading font-bold text-fg">
              Tanya Malanghub AI
            </h1>
            <p className="mx-auto max-w-[560px] text-body">
              Tanyakan apa saja dari berita Malanghub seputar Kota Malang,
              Kabupaten Malang, dan Kota Batu. Setiap jawaban dilengkapi artikel
              sumbernya.
            </p>
            <span className="mt-3 inline-block rounded-full bg-brand-soft px-3 py-0.5 text-[0.8rem] font-semibold text-brand">
              Gratis untuk semua
            </span>
          </header>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-line bg-input pt-3 pr-3 pb-2 pl-4 shadow-[0_4px_18px_var(--mh-shadow-color)] transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_0_0_4px_var(--mh-ring)]"
          >
            <label htmlFor="ask-question" className="sr-only">
              Pertanyaan
            </label>
            <textarea
              id="ask-question"
              ref={textareaRef}
              className="block max-h-48 min-h-12 w-full resize-none border-0 bg-transparent text-[1.05rem] leading-normal text-fg outline-0 placeholder:text-muted placeholder:opacity-100"
              rows={2}
              maxLength={MAX_LENGTH}
              placeholder="Contoh: Apa berita terbaru tentang Alun-alun Kota Batu?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-[0.8rem] text-muted">
                <span className="hidden sm:inline native-mobile:hidden!">
                  Enter untuk kirim · Shift+Enter untuk baris baru
                </span>
                {trimmed.length > MAX_LENGTH - 50 && (
                  <span className="text-warning">
                    {" "}
                    · {trimmed.length}/{MAX_LENGTH}
                  </span>
                )}
              </span>
              <button
                type="submit"
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border-0 bg-brand px-[1.1rem] py-[0.45rem] font-semibold text-brand-fg transition enabled:hover:-translate-y-px enabled:hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45",
                  focusRing,
                )}
                disabled={!canSubmit}
                aria-label="Kirim pertanyaan"
              >
                {loading ? "Mencari..." : "Tanya"}
                <span
                  className={loading ? "fa fa-spinner fa-spin" : "fa fa-send"}
                  aria-hidden="true"
                />
              </button>
            </div>
          </form>

          <p className="mt-5 mb-2 text-sm text-muted">Coba tanyakan:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                className={cx(
                  "rounded-full border border-line bg-surface px-3.5 py-1.5 text-left text-[0.9rem] text-fg transition-colors enabled:hover:border-brand enabled:hover:bg-brand-soft enabled:hover:text-brand disabled:opacity-50",
                  focusRing,
                )}
                disabled={loading}
                onClick={() => askExample(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {ask.isError && (
            <div
              className="mt-5 flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-danger"
              role="alert"
            >
              <span className="fa fa-exclamation-circle" aria-hidden="true" />
              {errorMessage(ask.error)}
            </div>
          )}

          <div ref={resultRef} className="mt-8 scroll-mt-[90px]" aria-live="polite">
            {(loading || result) && askedQuestion && (
              <div className="mb-4 flex justify-end">
                <div className="max-w-full rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 break-words text-brand-fg sm:max-w-[85%]">
                  {askedQuestion}
                </div>
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-line bg-surface p-5 pb-4 shadow-card">
                <div className="mb-3.5 flex items-center gap-2 text-muted">
                  <span className="inline-flex gap-1" aria-hidden="true">
                    {["", "[animation-delay:150ms]", "[animation-delay:300ms]"].map(
                      (delay, i) => (
                        <span
                          key={i}
                          className={cx(
                            "size-1.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none",
                            delay,
                          )}
                        />
                      ),
                    )}
                  </span>
                  Mencari di berita Malanghub...
                </div>
                {["w-[95%]", "w-[88%]", "w-[62%]"].map((width) => (
                  <div
                    key={width}
                    className={cx(
                      "mb-2.5 h-3.5 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none",
                      width,
                    )}
                  />
                ))}
              </div>
            )}

            {!loading && result && (
              <>
                <div className="rounded-2xl border border-line bg-surface p-5 pb-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className={cx(
                        aiGradientClass,
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-[10px]",
                      )}
                      aria-hidden="true"
                    >
                      <span className="fa fa-magic" />
                    </span>
                    <span className="font-bold text-fg">Malanghub AI</span>
                  </div>

                  {result.fallback ? (
                    <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-fg">
                      <span className="fa fa-info-circle mt-1" aria-hidden="true" />
                      <span>
                        AI sedang sibuk, jadi belum bisa merangkum jawaban.
                        Berikut artikel Malanghub yang paling relevan dengan
                        pertanyaan Anda.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 text-[1.02rem] leading-[1.7] text-body">
                      {answerLines?.map((line, i) =>
                        LIST_ITEM.test(line) ? (
                          <p
                            key={i}
                            className="relative pl-[1.1rem] before:absolute before:top-[0.7em] before:left-[0.2rem] before:size-1.5 before:rounded-full before:bg-brand before:content-['']"
                          >
                            <AnswerLine
                              line={line.replace(LIST_ITEM, "")}
                              sources={result.sources}
                            />
                          </p>
                        ) : (
                          <p key={i}>
                            <AnswerLine line={line} sources={result.sources} />
                          </p>
                        ),
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                    {!result.fallback && (
                      <button type="button" className={actionClass} onClick={copyAnswer}>
                        <span
                          className={copied ? "fa fa-check" : "fa fa-copy"}
                          aria-hidden="true"
                        />
                        {copied ? "Disalin" : "Salin jawaban"}
                      </button>
                    )}
                    <button type="button" className={actionClass} onClick={askAnother}>
                      <span className="fa fa-pencil" aria-hidden="true" />
                      Tanya hal lain
                    </button>
                  </div>
                </div>

                {result.sources.length > 0 && (
                  <>
                    <h2 className="mt-6 mb-3 text-[0.8rem] font-bold tracking-[0.06em] text-muted uppercase">
                      Sumber ({result.sources.length})
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                      {result.sources.map((source, i) => (
                        <Link
                          key={source.id}
                          href={`/news/${source.slug}`}
                          className={cx(
                            "flex gap-3 rounded-xl border border-line bg-surface p-3 no-underline transition hover:-translate-y-0.5 hover:border-brand",
                            focusRing,
                          )}
                        >
                          <span className={cx(softBadgeClass, "size-[1.6rem] text-[0.8rem]")}>
                            {i + 1}
                          </span>
                          <span>
                            <span className="line-clamp-3 text-[0.9rem] leading-snug font-semibold text-fg">
                              {readableTitle(source.title)}
                            </span>
                            <span className="mt-1 block text-[0.78rem] text-muted">
                              {formatSourceDate(source.created_at)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <p className="mt-8 text-center text-[0.8rem] text-muted">
            AI dapat membuat kesalahan, selalu periksa artikel sumbernya.
            Pertanyaan diproses oleh penyedia AI pihak ketiga (Google Gemini
            atau Groq), jadi jangan menuliskan data pribadi. Lihat{" "}
            <Link href="/privacy">Kebijakan Privasi</Link>.
          </p>
        </div>
      </PageSection>
    </>
  );
};
