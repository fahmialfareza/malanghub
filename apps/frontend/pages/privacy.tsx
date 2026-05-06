import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import { setActiveLink } from "../redux/actions/layoutActions";

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

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /{" "}
          <span className="breadcrumb_last" aria-current="page">
            Kebijakan Privasi
          </span>
        </div>
      </nav>

      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left mb-1">Kebijakan Privasi</h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                <span className="fa fa-calendar mr-2"></span>
                Terakhir diperbarui: Mei 2026
              </p>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">1. Pendahuluan</h5>
                <p className="mb-0">
                  Malanghub berkomitmen untuk melindungi privasi pengguna.
                  Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan,
                  menggunakan, dan melindungi informasi pribadi Anda saat
                  menggunakan layanan di www.malanghub.com.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">2. Data yang Kami Kumpulkan</h5>
                <p>Kami dapat mengumpulkan data berikut:</p>
                <ul className="pl-4 mb-0">
                  <li>
                    <strong>Data akun:</strong> Nama, alamat email, dan kata
                    sandi terenkripsi saat Anda mendaftar.
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

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  3. Cara Kami Menggunakan Data
                </h5>
                <p>Data yang dikumpulkan digunakan untuk:</p>
                <ul className="pl-4 mb-0">
                  <li>
                    Menyediakan dan meningkatkan layanan Malanghub.
                  </li>
                  <li>
                    Mengelola akun dan autentikasi pengguna.
                  </li>
                  <li>Menampilkan konten yang relevan.</li>
                  <li>
                    Menganalisis trafik dan performa situs.
                  </li>
                  <li>
                    Mencegah penyalahgunaan dan menjaga keamanan platform.
                  </li>
                </ul>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">4. Layanan Pihak Ketiga</h5>
                <p>
                  Malanghub menggunakan layanan pihak ketiga berikut yang
                  memiliki kebijakan privasi masing-masing:
                </p>
                <ul className="pl-4 mb-0">
                  <li>
                    <strong>Google Analytics & Google OAuth:</strong> Untuk
                    analitik dan masuk dengan akun Google.
                  </li>
                  <li>
                    <strong>Cloudflare:</strong> Untuk keamanan, CDN, dan
                    analitik web.
                  </li>
                  <li>
                    <strong>Cloudinary:</strong> Untuk penyimpanan dan
                    pengelolaan gambar.
                  </li>
                  <li>
                    <strong>Sentry:</strong> Untuk pemantauan dan pelaporan
                    error teknis.
                  </li>
                  <li>
                    <strong>Google Reader Revenue Manager:</strong> Untuk fitur
                    publikasi berita.
                  </li>
                </ul>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">5. Cookie</h5>
                <p className="mb-0">
                  Malanghub menggunakan cookie untuk menjaga sesi login dan
                  meningkatkan pengalaman pengguna. Anda dapat menonaktifkan
                  cookie melalui pengaturan browser, namun beberapa fitur situs
                  mungkin tidak berfungsi dengan baik.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">6. Keamanan Data</h5>
                <p className="mb-0">
                  Kami menerapkan langkah-langkah keamanan teknis yang wajar
                  untuk melindungi data Anda, termasuk enkripsi kata sandi dan
                  koneksi HTTPS. Namun, tidak ada sistem yang sepenuhnya aman,
                  dan kami tidak dapat menjamin keamanan absolut.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">7. Hak Pengguna</h5>
                <p>Anda memiliki hak untuk:</p>
                <ul className="pl-4 mb-3">
                  <li>
                    Mengakses dan memperbarui data profil Anda kapan saja.
                  </li>
                  <li>
                    Meminta penghapusan akun dan data pribadi Anda.
                  </li>
                  <li>Menarik persetujuan penggunaan data Anda.</li>
                </ul>
                <p className="mb-0">
                  Untuk menggunakan hak-hak ini, silakan hubungi kami melalui
                  halaman <Link href="/contact">Kontak</Link>.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">8. Data Anak-Anak</h5>
                <p className="mb-0">
                  Layanan Malanghub tidak ditujukan bagi anak-anak di bawah
                  usia 13 tahun. Kami tidak secara sengaja mengumpulkan data
                  pribadi dari anak-anak.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  9. Perubahan Kebijakan Privasi
                </h5>
                <p className="mb-0">
                  Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu.
                  Perubahan akan diberitahukan melalui halaman ini dengan
                  memperbarui tanggal di bagian atas. Penggunaan layanan secara
                  berkelanjutan setelah perubahan berarti Anda menerima
                  kebijakan yang baru.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">10. Hubungi Kami</h5>
                <p className="mb-0">
                  Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini,
                  silakan hubungi kami melalui halaman{" "}
                  <Link href="/contact">Kontak</Link>.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4 mt-5 mt-lg-0">
              <div className="card p-4 mb-4">
                <h6 className="font-weight-bold mb-3">
                  <span className="fa fa-list mr-2"></span>Daftar Isi
                </h6>
                <ol className="pl-4 mb-0" style={{ fontSize: "0.9rem" }}>
                  {sections.map((s, i) => (
                    <li key={i} className="mb-1">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="card p-4 mb-4">
                <h6 className="font-weight-bold mb-3">
                  <span className="fa fa-file-text-o mr-2"></span>Dokumen
                  Terkait
                </h6>
                <ul className="list-unstyled mb-0" style={{ fontSize: "0.9rem" }}>
                  <li>
                    <span className="fa fa-angle-right mr-2"></span>
                    <Link href="/terms">Syarat dan Ketentuan</Link>
                  </li>
                  <li>
                    <span className="fa fa-angle-right mr-2"></span>
                    <Link href="/contact">Hubungi Kami</Link>
                  </li>
                </ul>
              </div>

              <div className="card p-4">
                <h6 className="font-weight-bold mb-3">
                  <span className="fa fa-shield mr-2"></span>Komitmen Kami
                </h6>
                <p style={{ fontSize: "0.9rem" }} className="mb-0">
                  Malanghub berkomitmen menjaga privasi dan keamanan data
                  pengguna sesuai dengan peraturan yang berlaku di Indonesia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const mapDispatchToProps = {
  setActiveLink,
};

export default connect(null, mapDispatchToProps)(Privacy);
