import Head from "next/head";
import { Provider } from "react-redux";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MalanghubProviders, AppDownloadBanner } from "@malanghub/ui";
import type { AppProps } from "next/app";

import { wrapper } from "../redux/store";
import { useNextUiAdapters } from "../utils/sharedUiAdapters";
import { downloadLinks } from "../utils/downloadLinks";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";
import Alert from "../components/layouts/Alert";
import "@malanghub/ui/styles.css";

function MyApp({ Component, ...rest }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { pageProps } = props;
  const adapters = useNextUiAdapters();

  return (
    <MalanghubProviders
      apiBaseUrl={process.env.NEXT_PUBLIC_API_ADDRESS ?? ""}
      adapters={adapters}
    >
      <Provider store={store}>
        <Head>
          <title>Malanghub</title>
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
          />
        </Head>
        <AppDownloadBanner links={downloadLinks} />
        <Header />
        <Alert />

        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <Component {...pageProps} />
        </GoogleOAuthProvider>
        <Analytics />
        <Footer />
      </Provider>
    </MalanghubProviders>
  );
}

export default MyApp;
