import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { connect } from "react-redux";
import { setActiveLink } from "../redux/actions/layoutActions";

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

      <nav id="breadcrumbs" className="breadcrumbs">
        <div className="container page-wrapper">
          <Link href="/">Beranda</Link> /{" "}
          <span className="breadcrumb_last" aria-current="page">
            Syarat dan Ketentuan
          </span>
        </div>
      </nav>

      <div className="w3l-searchblock w3l-homeblock1 py-5">
        <div className="container py-lg-4 py-md-3">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8 most-recent">
              <h3 className="section-title-left mb-1">Syarat dan Ketentuan</h3>
              <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                <span className="fa fa-calendar mr-2"></span>
                Terakhir diperbarui: Mei 2026
              </p>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">1. Penerimaan Syarat</h5>
                <p>
                  Dengan mengakses dan menggunakan situs web Malanghub
                  (www.malanghub.com), Anda menyatakan telah membaca, memahami,
                  dan menyetujui Syarat dan Ketentuan ini. Jika Anda tidak
                  menyetujui syarat-syarat ini, mohon untuk tidak menggunakan
                  layanan kami.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">2. Tentang Malanghub</h5>
                <p>
                  Malanghub adalah portal berita dan informasi yang menyediakan
                  konten seputar Malang Raya, meliputi Kota Malang, Kabupaten
                  Malang, dan Kota Batu, Jawa Timur, Indonesia. Malanghub
                  dikelola secara nirlaba untuk kepentingan masyarakat Malang
                  Raya.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">3. Penggunaan Konten</h5>
                <p>
                  Seluruh konten yang tersedia di Malanghub, termasuk namun
                  tidak terbatas pada artikel berita, foto, dan grafis,
                  dilindungi oleh hak cipta.
                </p>
                <p className="mb-1">
                  <strong>Anda diperbolehkan untuk:</strong>
                </p>
                <ul className="pl-4 mb-3">
                  <li>
                    Membaca dan berbagi konten untuk keperluan pribadi dan
                    non-komersial.
                  </li>
                  <li>
                    Mengutip sebagian konten dengan mencantumkan sumber dan
                    tautan ke artikel asli.
                  </li>
                </ul>
                <p className="mb-1">
                  <strong>Anda tidak diperbolehkan untuk:</strong>
                </p>
                <ul className="pl-4">
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

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">4. Akun Pengguna</h5>
                <p>
                  Untuk menggunakan fitur tertentu seperti menulis berita, Anda
                  perlu mendaftarkan akun. Anda bertanggung jawab untuk:
                </p>
                <ul className="pl-4">
                  <li>Menjaga kerahasiaan kata sandi akun Anda.</li>
                  <li>
                    Memastikan informasi yang diberikan akurat dan terkini.
                  </li>
                  <li>
                    Seluruh aktivitas yang terjadi melalui akun Anda.
                  </li>
                </ul>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  5. Konten yang Dikirimkan Pengguna
                </h5>
                <p>
                  Dengan mengirimkan konten ke Malanghub, Anda memberikan
                  Malanghub hak non-eksklusif untuk menerbitkan, mengedit, dan
                  mendistribusikan konten tersebut. Malanghub berhak menolak
                  atau menghapus konten yang:
                </p>
                <ul className="pl-4">
                  <li>
                    Mengandung ujaran kebencian, SARA, atau konten yang
                    melanggar hukum.
                  </li>
                  <li>Bersifat spam atau menyesatkan.</li>
                  <li>Melanggar hak cipta pihak ketiga.</li>
                </ul>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">6. Penafian (Disclaimer)</h5>
                <p>
                  Malanghub berupaya menyajikan informasi yang akurat dan
                  terpercaya. Namun, kami tidak menjamin keakuratan,
                  kelengkapan, atau ketepatan waktu dari seluruh konten.
                  Penggunaan informasi di situs ini sepenuhnya merupakan
                  tanggung jawab Anda.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  7. Batasan Tanggung Jawab
                </h5>
                <p>
                  Malanghub tidak bertanggung jawab atas kerugian langsung
                  maupun tidak langsung yang timbul akibat penggunaan atau
                  ketidakmampuan menggunakan layanan ini, termasuk kerugian
                  akibat kesalahan informasi atau gangguan teknis.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  8. Tautan ke Situs Pihak Ketiga
                </h5>
                <p>
                  Malanghub dapat memuat tautan ke situs web pihak ketiga.
                  Malanghub tidak bertanggung jawab atas konten, kebijakan
                  privasi, atau praktik situs pihak ketiga tersebut.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">
                  9. Perubahan Syarat dan Ketentuan
                </h5>
                <p>
                  Malanghub berhak mengubah Syarat dan Ketentuan ini
                  sewaktu-waktu. Perubahan akan berlaku segera setelah
                  diterbitkan di halaman ini. Penggunaan layanan kami secara
                  berkelanjutan setelah perubahan diterbitkan berarti Anda
                  menerima syarat yang baru.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">10. Hukum yang Berlaku</h5>
                <p className="mb-0">
                  Syarat dan Ketentuan ini diatur oleh hukum yang berlaku di
                  Republik Indonesia.
                </p>
              </div>

              <div className="card mb-4 p-4">
                <h5 className="font-weight-bold">11. Hubungi Kami</h5>
                <p className="mb-0">
                  Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan
                  ini, silakan hubungi kami melalui halaman{" "}
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
                    <Link href="/privacy">Kebijakan Privasi</Link>
                  </li>
                  <li>
                    <span className="fa fa-angle-right mr-2"></span>
                    <Link href="/contact">Hubungi Kami</Link>
                  </li>
                </ul>
              </div>

              <div className="card p-4">
                <h6 className="font-weight-bold mb-3">
                  <span className="fa fa-envelope-o mr-2"></span>Ada Pertanyaan?
                </h6>
                <p style={{ fontSize: "0.9rem" }} className="mb-3">
                  Hubungi tim Malanghub jika Anda memiliki pertanyaan seputar
                  syarat penggunaan layanan kami.
                </p>
                <Link href="/contact" className="btn btn-style btn-primary btn-sm">
                  Hubungi Kami
                </Link>
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

export default connect(null, mapDispatchToProps)(Terms);
