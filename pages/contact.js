import { useEffect } from 'react';
import Head from 'next/head';
import { connect } from 'react-redux';
import Link from 'next/link';
import { setActiveLink } from '../redux/actions/layoutActions';

function Contact({ setActiveLink }) {
  useEffect(() => {
    setActiveLink('contact');
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
      </Head>

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /{' '}
          <span className="breadcrumb_last" aria-current="page">
            Kontak
          </span>
        </div>
      </nav>
      <section className="w3l-contact-2 py-5">
        <div className="container py-lg-5 py-md-4">
          <h3 className="section-title-left">Tinggalkan pesan untuk kami </h3>
          <div className="contact-grids d-grid">
            <div className="contact-left">
              <h3 className="mb-3">Kontak Kami</h3>
              <p className="text-justify">
                Semuanya dimulai dengan Halo! Kami di sini menjawab apa pun
                pertanyaan yang mungkin Anda miliki dan memberikan solusi
                efektif untuk Anda tentang layanan Malanghub.
              </p>

              <p className="text-justify">
                Kami memiliki pusat dukungan khusus untuk semua dukungan Anda.
                Kami biasanya akan menghubungi Anda dalam waktu 12-24 jam.
              </p>
              <div className="cont-details">
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-map-marker"></span>
                  </div>
                  <div className="cont-right">
                    <h6>Alamat</h6>
                    <p>Perum. Bumi Madinah Blok C3</p>
                    <p>
                      Jalan Ngasri, Mulyoagung, Dau, Malang, Jawa Timur 65151
                    </p>
                  </div>
                </div>
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-phone"></span>
                  </div>
                  <div className="cont-right">
                    <h6>Whatsapp Kami</h6>
                    <p>
                      <i className="fa fa-whatsapp"></i>{' '}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://wa.me/6287787146248"
                      >
                        087787146248
                      </a>
                    </p>
                  </div>
                </div>
                <div className="cont-top margin-up">
                  <div className="cont-left text-center">
                    <span className="fa fa-envelope-o"></span>
                  </div>
                  <div className="cont-right">
                    <h6>Email Kami</h6>
                    <p>
                      <a href="mailto:admin@malanghub.com" className="mail">
                        admin@malanghub.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-right">
              <div className="embed-responsive embed-responsive-1by1">
                <iframe
                  className="embed-responsive-item"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.6257545166436!2d112.56973751477908!3d-7.934097594284932!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7883c600d082fd%3A0x3f1caf9c821540c1!2sPerum.%20Bumi%20Madinah%20Blok%20C%202!5e0!3m2!1sen!2sid!4v1614682193710!5m2!1sen!2sid"
                  style={{ border: 0, borderRadius: 10 }}
                  allowfullscreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default connect(null, { setActiveLink })(Contact);
