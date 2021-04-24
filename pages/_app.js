import Head from "next/head";
import { wrapper } from "../redux/store";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Malanghub</title>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,uc-fitscreen=yes"
        />
        <meta name="title" content="Malanghub" />
        <meta
          name="description"
          content="Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/" />
        <meta property="og:title" content="Malanghub" />
        <meta
          property="og:description"
          content="Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.malanghub.com/" />
        <meta property="twitter:title" content="Malanghub" />
        <meta
          property="twitter:description"
          content="Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
      </Head>

      <Header />

      <Component {...pageProps} />

      <Footer />
    </>
  );
}

export default wrapper.withRedux(MyApp);
