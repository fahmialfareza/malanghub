import { useEffect } from "react";
import Head from "next/head";
import { connect } from "react-redux";
import Link from "next/link";
import { Breadcrumbs, Card, Container } from "@malanghub/ui";
import { setActiveLink } from "../redux/actions/layoutActions";

interface ContactProps {
  setActiveLink: (link: string) => void;
}

function Contact({ setActiveLink }: ContactProps) {
  useEffect(() => {
    setActiveLink("contact");
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Kontak</title>
        <meta name="title" content="Malanghub - Kontak" />
        <meta
          name="description"
          content="Malanghub - Kontak - Situs yang menyediakan informasi sekitar Malang Raya!"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/contact" />
        <meta property="og:title" content="Malanghub - Kontak" />
        <meta
          property="og:description"
          content="Malanghub - Kontak - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="og:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content="https://www.malanghub.com/contact"
        />
        <meta property="twitter:title" content="Malanghub - Kontak" />
        <meta
          property="twitter:description"
          content="Malanghub - Kontak - Situs yang menyediakan informasi sekitar Malang Raya!"
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />

        <link rel="canonical" href="https://www.malanghub.com/contact" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              name: "Kontak - Malanghub",
              description:
                "Hubungi tim Malanghub untuk pertanyaan, saran, atau kerjasama.",
              url: "https://www.malanghub.com/contact",
              inLanguage: "id-ID",
              isPartOf: {
                "@type": "WebSite",
                "@id": "https://www.malanghub.com/#website",
              },
            }),
          }}
        />
      </Head>

      <Breadcrumbs
        items={[{ label: "Beranda", href: "/" }, { label: "Kontak" }]}
        renderLink={({ href, className, children }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
      />
      <section className="tw:bg-bg tw:py-12 tw:sm:py-16">
        <Container>
          <div className="tw:mb-8 tw:max-w-2xl">
            <h1 className="tw:m-0 tw:font-heading tw:text-3xl tw:font-bold tw:text-fg tw:sm:text-4xl">
              Tinggalkan pesan untuk kami
            </h1>
          </div>
          <div className="tw:grid tw:gap-6 tw:lg:grid-cols-2">
            <Card className="tw:p-6 tw:sm:p-8">
              <h2 className="tw:mt-0 tw:mb-3 tw:font-heading tw:text-xl tw:font-semibold tw:text-fg">
                Kontak Kami
              </h2>
              <p className="tw:mb-3 tw:text-body">
                Semuanya dimulai dengan Halo! Kami di sini menjawab apa pun
                pertanyaan yang mungkin Anda miliki dan memberikan solusi
                efektif untuk Anda tentang layanan Malanghub.
              </p>
              <p className="tw:mb-6 tw:text-body">
                Kami memiliki pusat dukungan khusus untuk semua dukungan Anda.
                Kami biasanya akan menghubungi Anda dalam waktu 12-24 jam.
              </p>

              <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-5 tw:p-0">
                <li className="tw:flex tw:gap-4">
                  <span
                    aria-hidden="true"
                    className="fa fa-map-marker tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-brand-soft tw:text-lg tw:text-brand"
                  ></span>
                  <div>
                    <h3 className="tw:m-0 tw:mb-1 tw:text-sm tw:font-semibold tw:text-fg">
                      Alamat
                    </h3>
                    <p className="tw:text-[0.95rem] tw:text-body">
                      Perum. Bumi Madinah Blok C3
                    </p>
                    <p className="tw:text-[0.95rem] tw:text-body">
                      Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151
                    </p>
                  </div>
                </li>
                <li className="tw:flex tw:gap-4">
                  <span
                    aria-hidden="true"
                    className="fa fa-phone tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-brand-soft tw:text-lg tw:text-brand"
                  ></span>
                  <div>
                    <h3 className="tw:m-0 tw:mb-1 tw:text-sm tw:font-semibold tw:text-fg">
                      Whatsapp Kami
                    </h3>
                    <p className="tw:text-[0.95rem] tw:text-body">
                      <i className="fa fa-whatsapp" aria-hidden="true"></i>{" "}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://wa.me/62895424785888"
                        className="tw:font-semibold tw:text-brand tw:hover:text-brand-hover"
                      >
                        0895424785888
                      </a>
                    </p>
                  </div>
                </li>
                <li className="tw:flex tw:gap-4">
                  <span
                    aria-hidden="true"
                    className="fa fa-envelope-o tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-brand-soft tw:text-lg tw:text-brand"
                  ></span>
                  <div>
                    <h3 className="tw:m-0 tw:mb-1 tw:text-sm tw:font-semibold tw:text-fg">
                      Email Kami
                    </h3>
                    <p className="tw:text-[0.95rem] tw:text-body">
                      <a
                        href="mailto:admin@malanghub.com"
                        className="tw:font-semibold tw:text-brand tw:hover:text-brand-hover"
                      >
                        admin@malanghub.com
                      </a>
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
            <Card className="tw:overflow-hidden tw:p-0">
              <iframe
                title="Lokasi Malanghub di Google Maps"
                className="tw:block tw:aspect-square tw:size-full tw:min-h-80 tw:border-0 tw:lg:aspect-auto"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.6257545166436!2d112.56973751477908!3d-7.934097594284932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7883c600d082fd%3A0x3f1caf9c821540c1!2sPerum.%20Bumi%20Madinah%20Blok%20C%202!5e0!3m2!1sen!2sid!4v1614682193710!5m2!1sen!2sid"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}

export default connect(null, { setActiveLink })(Contact);
