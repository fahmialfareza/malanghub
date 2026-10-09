import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import { AskPage } from "@malanghub/ui";
import { setActiveLink } from "../redux/actions/layoutActions";

interface AskProps {
  setActiveLink: (link: string) => void;
}

// Title, description, canonical and og:image come from the shared page's
// Meta adapter; only the extra social tags live here.
function Ask({ setActiveLink }: AskProps) {
  useEffect(() => {
    setActiveLink("ask");
  }, []);

  return (
    <>
      <Head>
        <meta name="title" content="Tanya Malanghub AI" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/ask" />
        <meta property="og:title" content="Tanya Malanghub AI" />
        <meta
          property="og:description"
          content="Tanyakan apa saja seputar Malang Raya, dijawab berdasarkan berita Malanghub."
        />
      </Head>
      <AskPage />
    </>
  );
}

export default connect(null, { setActiveLink })(Ask);
