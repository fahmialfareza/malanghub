import Link from "next/link";
import Moment from "react-moment";
import "moment/locale/id";

const TrendingNews = ({ news, index }) => {
  return (
    <div className="grids5-info">
      <h4>{index + 1}.</h4>
      <div className="blog-info">
        <Link href={`/news/${news.slug}`} className="blog-desc1">
          {news.title}
        </Link>
        <div className="author align-items-center mt-2 mb-1">
          <Link href={`/users/${news.user._id}`} legacyBehavior>
            {news.user.name}
          </Link>{" "}
          in{" "}
          <Link href={`/newsCategories/${news.category?.slug}`} legacyBehavior>
            {news.category?.name}
          </Link>
        </div>
        <ul className="blog-meta">
          <li className="meta-item blog-lesson">
            <span className="meta-value">
              <Moment format="dddd, Do MMMM YYYY">{news.created_at}</Moment>
            </span>
          </li>
          <li className="meta-item blog-students">
            <span className="meta-value">
              {" "}
              {Math.ceil(news.time_read / 10)} menit
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TrendingNews;
