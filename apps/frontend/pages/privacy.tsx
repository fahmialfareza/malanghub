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
  "mb-5 p-6 sm:p-7 text-[0.97rem] leading-7",
  "[&_p]:mb-3 [&_p]:text-body [&_p]:leading-7 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul:last-child]:mb-0 [&_li]:mb-1.5 [&_li]:text-body [&_li::marker]:text-brand",
  "[&_strong]:text-fg [&_a]:font-semibold [&_a]:text-brand [&_a]:underline-offset-2 [&_a:hover]:underline",
);

const sectionTitleClass =
  "m-0 mb-3 font-heading text-lg font-bold text-fg";

const asideCardClass = cx(
  cardClass,
  "p-5 [&_li_a]:font-semibold [&_li_a]:text-body [&_li_a]:no-underline [&_li_a:hover]:text-brand",
);

const asideTitleClass =
  "m-0 mb-4 flex items-center font-heading text-base font-bold text-fg";

interface PrivacyProps {
  setActiveLink: (link: string) => void;
}

const sections = [
  "Pendahuluan",
  "Data yang Kami Kumpulkan",
  "Cara Kami Menggunakan Data",
  "Layanan Pihak Ketiga",
  "Cookie",
  "Keamanan Data",
  "Hak Pengguna",
  "Data Anak-Anak",
  "Perubahan Kebijakan Privasi",
  "Hubungi Kami",
];

function Privacy({ setActiveLink }: PrivacyProps) {
  useEffect(() => {
    setActiveLink("");
  }, []);

  return (
    <>
      <Head>
        <title>Malanghub - Kebijakan Privasi</title>
        <meta name="title" content="Malanghub - Kebijakan Privasi" />
        <meta
          name="description"
          content="Kebijakan Privasi Malanghub menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.malanghub.com/privacy" />
        <meta property="og:title" content="Malanghub - Kebijakan Privasi" />
        <meta
          property="og:description"
          content="Kebijakan Privasi Malanghub menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna."
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
          content="https://www.malanghub.com/privacy"
        />
        <meta
          property="twitter:title"
          content="Malanghub - Kebijakan Privasi"
        />
        <meta
          property="twitter:description"
          content="Kebijakan Privasi Malanghub menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna."
        />
        <meta
          property="twitter:image"
          content="https://www.malanghub.com/malanghub-meta.png"
        />
        <link rel="canonical" href="https://www.malanghub.com/privacy" />
      </Head>

      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Kebijakan Privasi" },
        ]}
        renderLink={renderNextLink}
      />

      <Container className="py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="min-w-0 lg:col-span-8">
            <h1 className="m-0 mb-2 font-heading text-3xl font-bold leading-tight text-fg sm:text-4xl">
              Kebijakan Privasi
            </h1>
            <p className="m-0 mb-8 text-sm text-muted">
              <span
                className="fa fa-calendar mr-2 text-brand"
                aria-hidden="true"
              ></span>
              Terakhir diperbarui: Mei 2026
            </p>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>1. Pendahuluan</h2>
              <p>
                Malanghub berkomitmen untuk melindungi privasi pengguna.
                Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan,
                menggunakan, dan melindungi informasi pribadi Anda saat
                menggunakan layanan di www.malanghub.com.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>2. Data yang Kami Kumpulkan</h2>
              <p>Kami dapat mengumpulkan data berikut:</p>
              <ul>
                <li>
                  <strong>Data akun:</strong> Nama, alamat email, dan kata sandi
                  terenkripsi saat Anda mendaftar.
                </li>
                <li>
                  <strong>Data profil:</strong> Foto profil, bio, motto, dan
                  tautan media sosial yang Anda isi secara sukarela.
                </li>
                <li>
                  <strong>Data penggunaan:</strong> Halaman yang dikunjungi,
                  artikel yang dibaca, dan interaksi di situs.
                </li>
                <li>
                  <strong>Data teknis:</strong> Alamat IP, jenis browser, dan
                  perangkat yang digunakan, dikumpulkan secara otomatis.
                </li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>
                3. Cara Kami Menggunakan Data
              </h2>
              <p>Data yang dikumpulkan digunakan untuk:</p>
              <ul>
                <li>Menyediakan dan meningkatkan layanan Malanghub.</li>
                <li>Mengelola akun dan autentikasi pengguna.</li>
                <li>Menampilkan konten yang relevan.</li>
                <li>Menganalisis trafik dan performa situs.</li>
                <li>Mencegah penyalahgunaan dan menjaga keamanan platform.</li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>4. Layanan Pihak Ketiga</h2>
              <p>
                Malanghub menggunakan layanan pihak ketiga berikut yang memiliki
                kebijakan privasi masing-masing:
              </p>
              <ul>
                <li>
                  <strong>Google Analytics & Google OAuth:</strong> Untuk
                  analitik dan masuk dengan akun Google.
                </li>
                <li>
                  <strong>Cloudflare:</strong> Untuk keamanan, CDN, dan analitik
                  web.
                </li>
                <li>
                  <strong>Cloudinary:</strong> Untuk penyimpanan dan pengelolaan
                  gambar.
                </li>
                <li>
                  <strong>Sentry:</strong> Untuk pemantauan dan pelaporan error
                  teknis.
                </li>
                <li>
                  <strong>Google Reader Revenue Manager:</strong> Untuk fitur
                  publikasi berita.
                </li>
                <li>
                  <strong>Google Gemini & Groq:</strong> Untuk fitur Tanya AI.
                  Pertanyaan yang Anda kirim (tanpa data akun) beserta potongan
                  artikel Malanghub diproses oleh penyedia AI ini untuk menyusun
                  jawaban, dan dapat digunakan oleh penyedia untuk meningkatkan
                  layanannya. Jangan menuliskan data pribadi di pertanyaan.
                </li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>5. Cookie</h2>
              <p>
                Malanghub menggunakan cookie untuk menjaga sesi login dan
                meningkatkan pengalaman pengguna. Anda dapat menonaktifkan
                cookie melalui pengaturan browser, namun beberapa fitur situs
                mungkin tidak berfungsi dengan baik.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>6. Keamanan Data</h2>
              <p>
                Kami menerapkan langkah-langkah keamanan teknis yang wajar untuk
                melindungi data Anda, termasuk enkripsi kata sandi dan koneksi
                HTTPS. Namun, tidak ada sistem yang sepenuhnya aman, dan kami
                tidak dapat menjamin keamanan absolut.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>7. Hak Pengguna</h2>
              <p>Anda memiliki hak untuk:</p>
              <ul>
                <li>Mengakses dan memperbarui data profil Anda kapan saja.</li>
                <li>Meminta penghapusan akun dan data pribadi Anda.</li>
                <li>Menarik persetujuan penggunaan data Anda.</li>
              </ul>
              <p>
                Untuk menggunakan hak-hak ini, silakan hubungi kami melalui
                halaman <Link href="/contact">Kontak</Link>.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>8. Data Anak-Anak</h2>
              <p>
                Layanan Malanghub tidak ditujukan bagi anak-anak di bawah usia
                13 tahun. Kami tidak secara sengaja mengumpulkan data pribadi
                dari anak-anak.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>
                9. Perubahan Kebijakan Privasi
              </h2>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu.
                Perubahan akan diberitahukan melalui halaman ini dengan
                memperbarui tanggal di bagian atas. Penggunaan layanan secara
                berkelanjutan setelah perubahan berarti Anda menerima kebijakan
                yang baru.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>10. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini,
                silakan hubungi kami melalui halaman{" "}
                <Link href="/contact">Kontak</Link>.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-list mr-2 text-brand"
                  aria-hidden="true"
                ></span>
                Daftar Isi
              </h2>
              <ol className="m-0 list-decimal pl-5 text-sm text-body marker:text-muted">
                {sections.map((s, i) => (
                  <li key={i} className="mb-1.5">
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-file-text-o mr-2 text-brand"
                  aria-hidden="true"
                ></span>
                Dokumen Terkait
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                <li>
                  <span
                    className="fa fa-angle-right mr-2 text-brand"
                    aria-hidden="true"
                  ></span>
                  <Link href="/terms">Syarat dan Ketentuan</Link>
                </li>
                <li>
                  <span
                    className="fa fa-angle-right mr-2 text-brand"
                    aria-hidden="true"
                  ></span>
                  <Link href="/contact">Hubungi Kami</Link>
                </li>
              </ul>
            </div>

            <div className={asideCardClass}>
              <h2 className={asideTitleClass}>
                <span
                  className="fa fa-shield mr-2 text-brand"
                  aria-hidden="true"
                ></span>
                Komitmen Kami
              </h2>
              <p className="m-0 text-sm leading-relaxed text-body">
                Malanghub berkomitmen menjaga privasi dan keamanan data pengguna
                sesuai dengan peraturan yang berlaku di Indonesia.
              </p>
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

export default connect(null, mapDispatchToProps)(Privacy);
