import Head from "next/head";
import { Provider } from "react-redux";
import { wrapper } from "../redux/store";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";
import Alert from "../components/layouts/Alert";

function MyApp({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { pageProps } = props;

  return (
    <Provider store={store}>
      <Head>
        <title>Malanghub</title>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
      </Head>

      <Header />

      <Alert />

      <Component {...pageProps} />

      <Footer />
    </Provider>
  );
}

export default MyApp;
