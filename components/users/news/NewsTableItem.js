import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";

const NewsTableItem = ({ news, index }) => {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>{news.title}</td>
      <td>
        <Moment format="MMMM Do, YYYY">{news.created_at}</Moment>
      </td>
      <td>
        <Moment format="MMMM Do, YYYY">{news.created_at}</Moment>
      </td>
      <td>
        <Link href={`/news/${news.slug}`}>
          <a className="btn btn-outline-primary m-1">
            <i className="fa fa-search-plus" aria-hidden="true"></i> Lihat
          </a>
        </Link>
      </td>
    </tr>
  );
};

export default connect(null, {})(NewsTableItem);
