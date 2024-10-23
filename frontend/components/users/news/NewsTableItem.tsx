import { useEffect } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import { getMyNews } from "../../../redux/actions/newsActions";
import { News } from "../../../models/news";

interface NewsTableItemProps {
  news: News;
  index: number;
  getMyNews: () => void;
}

const NewsTableItem = ({ news, index, getMyNews }: NewsTableItemProps) => {
  useEffect(() => {
    getMyNews();
  }, []);

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
        <Link
          href={`/news/${news.slug}`}
          className="btn btn-outline-primary m-1"
        >
          <i className="fa fa-search-plus" aria-hidden="true"></i>Lihat
        </Link>
      </td>
    </tr>
  );
};

export default connect(null, { getMyNews })(NewsTableItem);
