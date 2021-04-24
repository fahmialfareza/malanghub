import Link from "next/link";
import Moment from "react-moment";
import "moment/locale/id";
import parse from "html-react-parser";

const NewsItem = ({ news }) => {
  return (
    <>
      <div className="row">
        <div className="col-lg-5 col-md-6 item">
          <div className="card">
            <div className="card-header p-0 position-relative">
              <Link href={`/news/${news[0].slug}`}>
                <a className="embed-responsive embed-responsive-1by1">
                  <img
                    className="card-img-bottom d-block radius-image embed-responsive-item"
                    style={{ objectFit: "cover" }}
                    src={news[0].mainImage}
                    alt={news[0].mainImage}
                  />
                </a>
              </Link>
            </div>
            <div className="card-body p-0 blog-details">
              <Link href={`/news/${news[0].slug}`}>
                <a className="blog-desc">{news[0].title}</a>
              </Link>
              <div className="text-truncate">
                {parse(news[0].content.replace(/<(.|\n)*?>/g, ""))}
              </div>
              <div className="author align-items-center mt-3 mb-1">
                <Link href={`/users/${news[0].user._id}`}>
                  {news[0].user.name}
                </Link>{" "}
                in{" "}
                <Link href={`/newsCategories/${news[0].category?.slug}`}>
                  {news[0].category?.name}
                </Link>
              </div>
              <ul className="blog-meta">
                <li className="meta-item blog-lesson">
                  <span className="meta-value">
                    {" "}
                    <Moment format="dddd, Do MMMM YYYY">
                      {news[0].created_at}
                    </Moment>{" "}
                  </span>
                </li>
                <li className="meta-item blog-students">
                  <span className="meta-value">
                    {" "}
                    {Math.ceil(news[0].time_read)} menit
                  </span>
                </li>
              </ul>
              <Link href="/news">
                <a className="btn btn-style btn-outline mt-4">Semua Berita</a>
              </Link>
            </div>
          </div>
        </div>
        <div className="col-lg-7 col-md-6 mt-md-0 mt-5">
          <div className="list-view list-view1">
            {news.length > 0 &&
              news.map((item, index) => {
                if (index > 0)
                  return (
                    <div
                      key={item._id}
                      className={`grids5-info ` + (index > 1 && "mt-5")}
                    >
                      <Link href={`/news/${item.slug}`}>
                        <a className="d-block zoom embed-responsive embed-responsive-1by1">
                          <img
                            src={item.mainImage}
                            alt={item.mainImage}
                            style={{ objectFit: "cover" }}
                            className="img-fluid radius-image news-image embed-responsive-item"
                          />
                        </a>
                      </Link>
                      <div className="blog-info align-self">
                        <Link href={`/news/${item.slug}`}>
                          <a className="blog-desc1">{item.title}</a>
                        </Link>
                        <div className="author align-items-center mt-3 mb-1">
                          <Link href={`/users/${item.user._id}`}>
                            {item.user.name}
                          </Link>{" "}
                          in{" "}
                          <Link href={`/newsCategories/${item.category?.slug}`}>
                            {item.category?.name}
                          </Link>
                        </div>
                        <ul className="blog-meta">
                          <li className="meta-item blog-lesson">
                            <span className="meta-value">
                              {" "}
                              <Moment format="dddd, Do MMMM YYYY">
                                {item.created_at}
                              </Moment>{" "}
                            </span>
                          </li>
                          <li className="meta-item blog-students">
                            <span className="meta-value">
                              {" "}
                              {Math.ceil(item.time_read)} menit
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsItem;
