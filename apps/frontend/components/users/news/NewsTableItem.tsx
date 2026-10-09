import { useEffect } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import { buttonClass } from "@malanghub/ui";
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
      <td className="tw:text-muted">{index + 1}</td>
      <td className="tw:min-w-48 tw:font-semibold tw:text-fg">{news.title}</td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{news.created_at}</Moment>
      </td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{news.created_at}</Moment>
      </td>
      <td>
        <div className="tw:flex tw:justify-end">
          <Link
            href={`/news/${news.slug}`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            <i className="fa fa-search-plus" aria-hidden="true"></i> Lihat
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default connect(null, { getMyNews })(NewsTableItem);
