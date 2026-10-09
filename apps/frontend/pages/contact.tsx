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
      <section className="bg-bg py-12 sm:py-16">
        <Container>
          <div className="mb-8 max-w-2xl">
            <h1 className="m-0 font-heading text-3xl font-bold text-fg sm:text-4xl">
              Tinggalkan pesan untuk kami
            </h1>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <h2 className="mt-0 mb-3 font-heading text-xl font-semibold text-fg">
                Kontak Kami
              </h2>
              <p className="mb-3 text-body">
                Semuanya dimulai dengan Halo! Kami di sini menjawab apa pun
                pertanyaan yang mungkin Anda miliki dan memberikan solusi
                efektif untuk Anda tentang layanan Malanghub.
              </p>
              <p className="mb-6 text-body">
                Kami memiliki pusat dukungan khusus untuk semua dukungan Anda.
                Kami biasanya akan menghubungi Anda dalam waktu 12-24 jam.
              </p>

              <ul className="m-0 flex list-none flex-col gap-5 p-0">
                <li className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg text-brand"
                  >
                    <span className="fa fa-map-marker" />
                  </span>
                  <div>
                    <h3 className="m-0 mb-1 text-sm font-semibold text-fg">
                      Alamat
                    </h3>
                    <p className="text-[0.95rem] text-body">
                      Perum. Bumi Madinah Blok C3
                    </p>
                    <p className="text-[0.95rem] text-body">
                      Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg text-brand"
                  >
                    <span className="fa fa-phone" />
                  </span>
                  <div>
                    <h3 className="m-0 mb-1 text-sm font-semibold text-fg">
                      Whatsapp Kami
                    </h3>
                    <p className="text-[0.95rem] text-body">
                      <i className="fa fa-whatsapp" aria-hidden="true"></i>{" "}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://wa.me/62895424785888"
                        className="font-semibold text-brand hover:text-brand-hover"
                      >
                        0895424785888
                      </a>
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg text-brand"
                  >
                    <span className="fa fa-envelope-o" />
                  </span>
                  <div>
                    <h3 className="m-0 mb-1 text-sm font-semibold text-fg">
                      Email Kami
                    </h3>
                    <p className="text-[0.95rem] text-body">
                      <a
                        href="mailto:admin@malanghub.com"
                        className="font-semibold text-brand hover:text-brand-hover"
                      >
                        admin@malanghub.com
                      </a>
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
            <Card className="overflow-hidden p-0">
              <iframe
                title="Lokasi Malanghub di Google Maps"
                className="block aspect-square size-full min-h-80 border-0 lg:aspect-auto"
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
