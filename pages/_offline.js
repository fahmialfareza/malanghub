import { connect } from 'react-redux';
import Link from 'next/link';

function Offline() {
  return (
    <div>
      <h1>Kamu sedang offline!</h1>
      <Link href="/">
        <a className="btn btn-style btn-outline">Kembali ke Beranda</a>
      </Link>
    </div>
  );
}

export default connect(null, {})(Offline);
