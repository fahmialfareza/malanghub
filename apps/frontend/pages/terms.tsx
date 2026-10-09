import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import { setActiveLink } from "../redux/actions/layoutActions";
import {
  Breadcrumbs,
  Container,
  buttonClass,
  cardClass,
  cx,
} from "@malanghub/ui";
import { renderNextLink } from "../components/news/NewsListingLayout";

const sectionClass = cx(
  cardClass,
  "tw:mb-5 tw:p-6 tw:sm:p-7 tw:text-[0.97rem] tw:leading-7",
  "tw:[&_p]:mb-3 tw:[&_p]:text-body tw:[&_p]:leading-7 tw:[&_p:last-child]:mb-0",
  "tw:[&_ul]:mb-3 tw:[&_ul]:list-disc tw:[&_ul]:pl-6 tw:[&_ul:last-child]:mb-0 tw:[&_li]:mb-1.5 tw:[&_li]:text-body tw:[&_li::marker]:text-brand",
  "tw:[&_strong]:text-fg tw:[&_a]:font-semibold tw:[&_a]:text-brand tw:[&_a]:underline-offset-2 tw:[&_a:hover]:underline",
);

const sectionTitleClass =
  "tw:m-0 tw:mb-3 tw:font-heading tw:text-lg tw:font-bold tw:text-fg";

const asideCardClass = cx(
  cardClass,
  "tw:p-5 tw:[&_li_a]:font-semibold tw:[&_li_a]:text-body tw:[&_li_a]:no-underline tw:[&_li_a:hover]:text-brand",
);

const asideTitleClass =
  "tw:m-0 tw:mb-4 tw:flex tw:items-center tw:font-heading tw:text-base tw:font-bold tw:text-fg";

interface TermsProps {
  setActiveLink: (link: string) => void;
}

const sections = [
  "Penerimaan Syarat",
  "Tentang Malanghub",
  "Penggunaan Konten",
  "Akun Pengguna",
  "Konten yang Dikirimkan Pengguna",
  "Penafian",
  "Batasan Tanggung Jawab",
  "Tautan ke Situs Pihak Ketiga",
  "Perubahan Syarat dan Ketentuan",
  "Hukum yang Berlaku",
  "Hubungi Kami",
];

function Terms({ setActiveLink }: TermsProps) {
  useEffect(() => {
    setActiveLink("");
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Syarat dan Ketentuan</title>
        <meta name="title" content="Malanghub - Syarat dan Ketentuan" />
        <meta
          name="description"
          content="Syarat dan Ketentuan penggunaan layanan Malanghub, portal berita dan informasi seputar Malang Raya."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/terms" />
        <meta property="og:title" content="Malanghub - Syarat dan Ketentuan" />
        <meta
          property="og:description"
          content="Syarat dan Ketentuan penggunaan layanan Malanghub, portal berita dan informasi seputar Malang Raya."
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
          content="https://www.malanghub.com/terms"
        />
        <meta
          property="twitter:title"
          content="Malanghub - Syarat dan Ketentuan"
        />
        <meta
          property="twitter:description"
          content="Syarat dan Ketentuan penggunaan layanan Malanghub, portal berita dan informasi seputar Malang Raya."
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <link rel="canonical" href="https://www.malanghub.com/terms" />
      </Head>

      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Syarat dan Ketentuan" },
        ]}
        renderLink={renderNextLink}
      />

      <Container className="tw:py-10 tw:lg:py-14">
        <div className="tw:grid tw:gap-8 tw:lg:grid-cols-12">
          {/* Main Content */}
          <div className="tw:min-w-0 tw:lg:col-span-8">
            <h1 className="tw:m-0 tw:mb-2 tw:font-heading tw:text-3xl tw:font-bold tw:leading-tight tw:text-fg tw:sm:text-4xl">
              Syarat dan Ketentuan
            </h1>
            <p className="tw:m-0 tw:mb-8 tw:text-sm tw:text-muted">
              <span
                className="fa fa-calendar tw:mr-2 tw:text-brand"
                aria-hidden="true"
              ></span>
              Terakhir diperbarui: Mei 2026
            </p>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>1. Penerimaan Syarat</h2>
              <p>
                Dengan mengakses dan menggunakan situs web Malanghub
                (www.malanghub.com), Anda menyatakan telah membaca, memahami,
                dan menyetujui Syarat dan Ketentuan ini. Jika Anda tidak
                menyetujui syarat-syarat ini, mohon untuk tidak menggunakan
                layanan kami.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>2. Tentang Malanghub</h2>
              <p>
                Malanghub adalah portal berita dan informasi yang menyediakan
                konten seputar Malang Raya, meliputi Kota Malang, Kabupaten
                Malang, dan Kota Batu, Jawa Timur, Indonesia. Malanghub dikelola
                secara nirlaba untuk kepentingan masyarakat Malang Raya.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>3. Penggunaan Konten</h2>
              <p>
                Seluruh konten yang tersedia di Malanghub, termasuk namun tidak
                terbatas pada artikel berita, foto, dan grafis, dilindungi oleh
                hak cipta.
              </p>
              <p>
                <strong>Anda diperbolehkan untuk:</strong>
              </p>
              <ul>
                <li>
                  Membaca dan berbagi konten untuk keperluan pribadi dan
                  non-komersial.
                </li>
                <li>
                  Mengutip sebagian konten dengan mencantumkan sumber dan tautan
                  ke artikel asli.
                </li>
              </ul>
              <p>
                <strong>Anda tidak diperbolehkan untuk:</strong>
              </p>
              <ul>
                <li>
                  Menyalin, mendistribusikan, atau mereproduksi konten secara
                  keseluruhan tanpa izin tertulis.
                </li>
                <li>
                  Menggunakan konten untuk keperluan komersial tanpa seizin
                  Malanghub.
                </li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>4. Akun Pengguna</h2>
              <p>
                Untuk menggunakan fitur tertentu seperti menulis berita, Anda
                perlu mendaftarkan akun. Anda bertanggung jawab untuk:
              </p>
              <ul>
                <li>Menjaga kerahasiaan kata sandi akun Anda.</li>
                <li>Memastikan informasi yang diberikan akurat dan terkini.</li>
                <li>Seluruh aktivitas yang terjadi melalui akun Anda.</li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>
                5. Konten yang Dikirimkan Pengguna
              </h2>
              <p>
                Dengan mengirimkan konten ke Malanghub, Anda memberikan
                Malanghub hak non-eksklusif untuk menerbitkan, mengedit, dan
                mendistribusikan konten tersebut. Malanghub berhak menolak atau
                menghapus konten yang:
              </p>
              <ul>
                <li>
                  Mengandung ujaran kebencian, SARA, atau konten yang melanggar
                  hukum.
                </li>
                <li>Bersifat spam atau menyesatkan.</li>
                <li>Melanggar hak cipta pihak ketiga.</li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>6. Penafian (Disclaimer)</h2>
              <p>
                Malanghub berupaya menyajikan informasi yang akurat dan
                terpercaya. Namun, kami tidak menjamin keakuratan, kelengkapan,
                atau ketepatan waktu dari seluruh konten. Penggunaan informasi
                di situs ini sepenuhnya merupakan tanggung jawab Anda.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>7. Batasan Tanggung Jawab</h2>
              <p>
                Malanghub tidak bertanggung jawab atas kerugian langsung maupun
                tidak langsung yang timbul akibat penggunaan atau ketidakmampuan
                menggunakan layanan ini, termasuk kerugian akibat kesalahan
                informasi atau gangguan teknis.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>
                8. Tautan ke Situs Pihak Ketiga
              </h2>
              <p>
                Malanghub dapat memuat tautan ke situs web pihak ketiga.
                Malanghub tidak bertanggung jawab atas konten, kebijakan
                privasi, atau praktik situs pihak ketiga tersebut.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>
                9. Perubahan Syarat dan Ketentuan
              </h2>
              <p>
                Malanghub berhak mengubah Syarat dan Ketentuan ini
                sewaktu-waktu. Perubahan akan berlaku segera setelah diterbitkan
                di halaman ini. Penggunaan layanan kami secara berkelanjutan
                setelah perubahan diterbitkan berarti Anda menerima syarat yang
                baru.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>10. Hukum yang Berlaku</h2>
              <p>
                Syarat dan Ketentuan ini diatur oleh hukum yang berlaku di
                Republik Indonesia.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>11. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini,
                silakan hubungi kami melalui halaman{" "}
                <Link href="/contact">Kontak</Link>.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="tw:flex tw:flex-col tw:gap-5 tw:lg:col-span-4 tw:lg:sticky tw:lg:top-24 tw:lg:self-start">
            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-list tw:mr-2 tw:text-brand"
                  aria-hidden="true"
                ></span>
                Daftar Isi
              </h2>
              <ol className="tw:m-0 tw:list-decimal tw:pl-5 tw:text-sm tw:text-body tw:marker:text-muted">
                {sections.map((s, i) => (
                  <li key={i} className="tw:mb-1.5">
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-file-text-o tw:mr-2 tw:text-brand"
                  aria-hidden="true"
                ></span>
                Dokumen Terkait
              </h2>
              <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0 tw:text-sm">
                <li>
                  <span
                    className="fa fa-angle-right tw:mr-2 tw:text-brand"
                    aria-hidden="true"
                  ></span>
                  <Link href="/privacy">Kebijakan Privasi</Link>
                </li>
                <li>
                  <span
                    className="fa fa-angle-right tw:mr-2 tw:text-brand"
                    aria-hidden="true"
                  ></span>
                  <Link href="/contact">Hubungi Kami</Link>
                </li>
              </ul>
            </div>

            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-envelope-o tw:mr-2 tw:text-brand"
                  aria-hidden="true"
                ></span>
                Ada Pertanyaan?
              </h2>
              <p className="tw:m-0 tw:mb-4 tw:text-sm tw:leading-relaxed tw:text-body">
                Hubungi tim Malanghub jika Anda memiliki pertanyaan seputar
                syarat penggunaan layanan kami.
              </p>
              <Link href="/contact" className={buttonClass({ size: "sm" })}>
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

const mapDispatchToProps = {
  setActiveLink,
};

export default connect(null, mapDispatchToProps)(Terms);
