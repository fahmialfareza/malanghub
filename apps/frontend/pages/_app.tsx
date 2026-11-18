import Head from "next/head";
import Script from "next/script";
import { Provider } from "react-redux";
import { MalanghubProviders, AppDownloadBanner } from "@malanghub/ui";
import type { AppProps } from "next/app";

import { wrapper } from "../redux/store";
import { useNextUiAdapters } from "../utils/sharedUiAdapters";
import { downloadLinks } from "../utils/downloadLinks";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";
import Alert from "../components/layouts/Alert";
import "../styles/app.css";

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
            content="width=device-width,initial-scale=1"
          />
        </Head>
        {/* Reader Revenue Manager, loaded after the page is idle so it stays off the critical path. */}
        <Script
          id="swg-basic"
          src="https://news.google.com/swg/js/v1/swg-basic.js"
          strategy="lazyOnload"
        />
        <Script id="swg-basic-init" strategy="lazyOnload">
          {`(self.SWG_BASIC = self.SWG_BASIC || []).push(basicSubscriptions => {
            basicSubscriptions.init({
              type: "NewsArticle",
              isPartOfType: ["Product"],
              isPartOfProductId: "CAow2L3GDA:openaccess",
              clientOptions: { theme: "light", lang: "id" },
            });
          });`}
        </Script>
        <AppDownloadBanner links={downloadLinks} />
        <Header />
        <Alert />

        <Component {...pageProps} />
        <Footer />
      </Provider>
    </MalanghubProviders>
  );
}

export default MyApp;
