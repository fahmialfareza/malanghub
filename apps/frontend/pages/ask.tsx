import { FormEvent, ReactNode, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import Spinner from "../components/layouts/Spinner";
import { setActiveLink } from "../redux/actions/layoutActions";
import { askAi } from "../redux/actions/aiActions";
import { RootState } from "../redux/store";
import { AiReducerState } from "../redux/types";
import { AiSource } from "../models/ai";

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

// Turns "[1]" citations in a line of the answer into links to the source article.
function renderLine(line: string, sources: AiSource[]): ReactNode[] {
  return line.split(/(\[\d+\])/g).map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    const source = match ? sources[Number(match[1]) - 1] : undefined;
    if (!source) {
      return part;
    }
    return (
      <Link key={i} href={`/news/${source.slug}`} title={source.title}>
        <sup>{part}</sup>
      </Link>
    );
  });
}

function Ask({
  ai: { result, loading, error },
  askAi,
  setActiveLink,
}: AskProps) {
  const [question, setQuestion] = useState("");

  useEffect(() => {
    setActiveLink("ask");
  }, []);

  const trimmed = question.trim();
  const canSubmit =
    !loading && trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      askAi(trimmed);
    }
  };

  const ask = (q: string) => {
    setQuestion(q);
    askAi(q);
  };

  return (
    <>
      <Head>
        <title>Malanghub - Tanya AI</title>
        <meta name="title" content="Malanghub - Tanya AI" />
        <meta
          name="description"
          content="Tanya AI Malanghub - Tanyakan apa saja seputar Malang Raya, dijawab berdasarkan berita Malanghub. Gratis untuk semua!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/ask" />
        <meta property="og:title" content="Malanghub - Tanya AI" />
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
            Tanya AI
          </span>
        </div>
      </nav>

      <section className="py-5">
        <div className="container py-lg-4">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <h3 className="section-title-left mb-2">Tanya AI Malang Raya</h3>
              <p className="text-muted mb-4">
                Tanyakan apa saja seputar Kota Malang, Kabupaten Malang, dan
                Kota Batu. Jawaban disusun dari berita Malanghub. Gratis untuk
                semua!
              </p>

              <form onSubmit={onSubmit} className="mb-3">
                <div className="form-group">
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={MAX_LENGTH}
                    placeholder="Contoh: Apa berita terbaru tentang Alun-alun Kota Batu?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        onSubmit(e);
                      }
                    }}
                  />
                  <small className="form-text text-muted text-right">
                    {trimmed.length}/{MAX_LENGTH}
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canSubmit}
                >
                  {loading ? "Mencari jawaban..." : "Tanya"}
                </button>
              </form>

              <div className="mb-4">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="btn btn-sm btn-outline-secondary mr-2 mb-2"
                    disabled={loading}
                    onClick={() => ask(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              {loading && <Spinner />}

              {!loading && result && (
                <div className="card p-4 mb-4">
                  {result.fallback ? (
                    <p className="mb-3">
                      AI sedang sibuk, berikut artikel terkait yang mungkin
                      membantu:
                    </p>
                  ) : (
                    <div className="mb-3">
                      {result.answer
                        .split("\n")
                        .filter((line) => line.trim() !== "")
                        .map((line, i) => (
                          <p key={i}>{renderLine(line, result.sources)}</p>
                        ))}
                    </div>
                  )}

                  {result.sources.length > 0 && (
                    <>
                      <h6 className="font-weight-bold">Sumber</h6>
                      <ol className="pl-4 mb-0">
                        {result.sources.map((source) => (
                          <li key={source.id}>
                            <Link href={`/news/${source.slug}`}>
                              {source.title}
                            </Link>{" "}
                            <small className="text-muted">
                              (
                              {new Date(source.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                              )
                            </small>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              )}

              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                AI dapat membuat kesalahan. Selalu periksa artikel sumbernya.
                Pertanyaan Anda diproses oleh penyedia AI pihak ketiga (Google
                Gemini atau Groq), jadi jangan menuliskan data pribadi. Lihat{" "}
                <Link href="/privacy">Kebijakan Privasi</Link>.
              </p>
            </div>
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
