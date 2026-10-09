import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import { setActiveLink } from "../redux/actions/layoutActions";
import { askAi } from "../redux/actions/aiActions";
import { RootState } from "../redux/store";
import { AiReducerState } from "../redux/types";
import { AiSource } from "../models/ai";
import styles from "../styles/Ask.module.css";

interface AskProps {
  ai: AiReducerState;
  askAi: (question: string) => void;
  setActiveLink: (link: string) => void;
}

const MIN_LENGTH = 5;
const MAX_LENGTH = 500;

const EXAMPLE_QUESTIONS = [
  "Apa berita terbaru di Kota Batu?",
  "Ada acara apa saja di Malang akhir-akhir ini?",
  "Bagaimana kondisi lalu lintas di Kota Malang?",
  "Rekomendasi wisata di Kabupaten Malang?",
];

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

// Some article titles are written in ALL CAPS; show them in title case so the
// source list is easier to scan.
function readableTitle(title: string): string {
  const letters = title.replace(/[^A-Za-z]/g, "");
  if (letters.length < 8 || letters !== letters.toUpperCase()) {
    return title;
  }
  return title
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Turns "[1]" citations in a line of the answer into links to the source
// article and drops stray Markdown emphasis.
function renderLine(line: string, sources: AiSource[]): ReactNode[] {
  return line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .split(/(\[\d+\])/g)
    .map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      const source = match ? sources[Number(match[1]) - 1] : undefined;
      if (!source) {
        return part;
      }
      return (
        <Link
          key={i}
          href={`/news/${source.slug}`}
          title={readableTitle(source.title)}
          className={styles.cite}
        >
          {match![1]}
        </Link>
      );
    });
}

function Ask({
  ai: { question: askedQuestion, result, loading, error },
  askAi,
  setActiveLink,
}: AskProps) {
  const [question, setQuestion] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveLink("ask");
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

  const trimmed = question.trim();
  const canSubmit =
    !loading && trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const submit = (q: string) => {
    setCopied(false);
    askAi(q);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      submit(trimmed);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    textareaRef.current?.focus();
  };

  const copyAnswer = async () => {
    if (!result) {
      return;
    }
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
      <Head>
        <title>Tanya Malanghub AI</title>
        <meta name="title" content="Tanya Malanghub AI" />
        <meta
          name="description"
          content="Tanya Malanghub AI - Tanyakan apa saja seputar Malang Raya, dijawab berdasarkan berita Malanghub. Gratis untuk semua!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/ask" />
        <meta property="og:title" content="Tanya Malanghub AI" />
        <meta
          property="og:description"
          content="Tanyakan apa saja seputar Malang Raya, dijawab berdasarkan berita Malanghub."
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <link rel="canonical" href="https://www.malanghub.com/ask" />
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /{" "}
          <span className="breadcrumb_last" aria-current="page">
            Tanya Malanghub AI
          </span>
        </div>
      </nav>

      <section className="py-5">
        <div className="container py-lg-4">
          <div className={styles.page}>
            <header className={styles.hero}>
              <div className={styles.heroIcon} aria-hidden="true">
                <span className="fa fa-comments"></span>
              </div>
              <h1 className={styles.title}>Tanya Malanghub AI</h1>
              <p className={styles.subtitle}>
                Tanyakan apa saja dari berita Malanghub seputar Kota Malang,
                Kabupaten Malang, dan Kota Batu. Setiap jawaban dilengkapi
                artikel sumbernya.
              </p>
              <span className={styles.badge}>Gratis untuk semua</span>
            </header>

            <form onSubmit={onSubmit} className={styles.composer}>
              <label htmlFor="ask-question" className="sr-only">
                Pertanyaan
              </label>
              <textarea
                id="ask-question"
                ref={textareaRef}
                className={styles.textarea}
                rows={2}
                maxLength={MAX_LENGTH}
                placeholder="Contoh: Apa berita terbaru tentang Alun-alun Kota Batu?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
              />
              <div className={styles.composerFooter}>
                <span className={styles.hint}>
                  Enter untuk kirim · Shift+Enter untuk baris baru
                  {trimmed.length > MAX_LENGTH - 50 && (
                    <span className={styles.counterWarn}>
                      {" "}
                      · {trimmed.length}/{MAX_LENGTH}
                    </span>
                  )}
                </span>
                <button
                  type="submit"
                  className={styles.send}
                  disabled={!canSubmit}
                  aria-label="Kirim pertanyaan"
                >
                  {loading ? "Mencari..." : "Tanya"}
                  <span
                    className={loading ? "fa fa-spinner fa-spin" : "fa fa-send"}
                    aria-hidden="true"
                  ></span>
                </button>
              </div>
            </form>

            <p className={styles.suggestionsLabel}>Coba tanyakan:</p>
            <div className={styles.chips}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={styles.chip}
                  disabled={loading}
                  onClick={() => askExample(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            {error && (
              <div className={styles.error} role="alert">
                <span className="fa fa-exclamation-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            <div ref={resultRef} className={styles.result} aria-live="polite">
              {(loading || result) && askedQuestion && (
                <div className={styles.questionEcho}>
                  <div className={styles.questionBubble}>{askedQuestion}</div>
                </div>
              )}

              {loading && (
                <div className={styles.answerCard}>
                  <div className={styles.loadingText}>
                    <span className={styles.dots} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    Mencari di berita Malanghub...
                  </div>
                  <div className={styles.skeleton} style={{ width: "95%" }} />
                  <div className={styles.skeleton} style={{ width: "88%" }} />
                  <div className={styles.skeleton} style={{ width: "62%" }} />
                </div>
              )}

              {!loading && result && (
                <>
                  <div className={styles.answerCard}>
                    <div className={styles.answerHeader}>
                      <span className={styles.avatar} aria-hidden="true">
                        <span className="fa fa-magic"></span>
                      </span>
                      <span className={styles.answerTitle}>Malanghub AI</span>
                    </div>

                    {result.fallback ? (
                      <div className={styles.notice}>
                        <span
                          className="fa fa-info-circle"
                          aria-hidden="true"
                        />
                        <span>
                          AI sedang sibuk, jadi belum bisa merangkum jawaban.
                          Berikut artikel Malanghub yang paling relevan dengan
                          pertanyaan Anda.
                        </span>
                      </div>
                    ) : (
                      <div className={styles.answerBody}>
                        {answerLines?.map((line, i) =>
                          LIST_ITEM.test(line) ? (
                            <p key={i} className={styles.listItem}>
                              {renderLine(
                                line.replace(LIST_ITEM, ""),
                                result.sources,
                              )}
                            </p>
                          ) : (
                            <p key={i}>{renderLine(line, result.sources)}</p>
                          ),
                        )}
                      </div>
                    )}

                    <div className={styles.actions}>
                      {!result.fallback && (
                        <button
                          type="button"
                          className={styles.action}
                          onClick={copyAnswer}
                        >
                          <span
                            className={copied ? "fa fa-check" : "fa fa-copy"}
                            aria-hidden="true"
                          />
                          {copied ? "Disalin" : "Salin jawaban"}
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.action}
                        onClick={askAnother}
                      >
                        <span className="fa fa-pencil" aria-hidden="true" />
                        Tanya hal lain
                      </button>
                    </div>
                  </div>

                  {result.sources.length > 0 && (
                    <>
                      <h2 className={styles.sourcesTitle}>
                        Sumber ({result.sources.length})
                      </h2>
                      <div className={styles.sources}>
                        {result.sources.map((source, i) => (
                          <Link
                            key={source.id}
                            href={`/news/${source.slug}`}
                            className={styles.source}
                          >
                            <span className={styles.sourceNumber}>{i + 1}</span>
                            <span>
                              <span className={styles.sourceTitle}>
                                {readableTitle(source.title)}
                              </span>
                              <span className={styles.sourceDate}>
                                {formatDate(source.created_at)}
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

            <p className={styles.disclaimer}>
              AI dapat membuat kesalahan, selalu periksa artikel sumbernya.
              Pertanyaan diproses oleh penyedia AI pihak ketiga (Google Gemini
              atau Groq), jadi jangan menuliskan data pribadi. Lihat{" "}
              <Link href="/privacy">Kebijakan Privasi</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

const mapStateToProps = (state: RootState) => ({
  ai: state.ai,
});

export default connect(mapStateToProps, { askAi, setActiveLink })(Ask);
