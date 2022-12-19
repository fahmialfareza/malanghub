import { connect } from "react-redux";
import Link from "next/link";

function Offline() {
  return (
    <div
      className="container"
      style={{ width: "100%", height: "50vh", display: "flex" }}
    >
      <div className="m-auto">
        <h1>Kamu sedang offline!</h1>
        <Link href="/" className="btn btn-style btn-outline">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default connect(null, {})(Offline);
