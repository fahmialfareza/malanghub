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
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
      </Head>

      <Header />

      <Component {...pageProps} />

      <Footer />
    </>
  );
}

export default wrapper.withRedux(MyApp);
