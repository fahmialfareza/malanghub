import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import "moment/locale/id";
import parse from "html-react-parser";
import ReactPaginate from "react-paginate";
import { getAllNews } from "../../redux/actions/newsActions";
import { NewsWithPagination } from "../../models/news";

interface AllNewsItemProps {
  news: NewsWithPagination;
  getAllNews: (page: number) => void;
}

const AllNewsItem = ({ news, getAllNews }: AllNewsItemProps) => {
  const handlePageClick = (data: { selected: number }) => {
    let selected = data.selected + 1;

    getAllNews(selected);
  };

  return (
    <div className="row">
      <div className="col-md-12 item">
        <div className="card">
          <div className="card-header p-0 position-relative embed-responsive embed-responsive-1by1">
            <Link href={`/news/${news.data[0].slug}`} legacyBehavior>
              <img
                className="card-img-bottom d-block radius-image embed-responsive-item"
                style={{ objectFit: "cover" }}
                src={news.data[0].mainImage}
                alt={news.data[0].mainImage}
              />
            </Link>
          </div>
          <div className="card-body p-0 blog-details">
            <Link href={`/news/${news.data[0].slug}`} className="blog-desc">
              {news.data[0].title}
            </Link>
            <div className="text-truncate">
              {parse(news.data[0].content.replace(/<(.|\n)*?>/g, ""))}
            </div>
            <div className="author align-items-center mt-3 mb-1">
              {news.data[0].user && news.data[0].user._id ? (
                <Link href={`/users/${news.data[0].user._id}`} legacyBehavior>
                  {news.data[0].user.name ?? "Penulis"}
                </Link>
              ) : (
                <span>{news.data[0].user?.name ?? "Penulis"}</span>
              )}{" "}
              di{" "}
              {news.data[0].category &&
              typeof news.data[0].category !== "string" &&
              news.data[0].category.slug ? (
                <Link
                  href={`/newsCategories/${news.data[0].category.slug}`}
                  legacyBehavior
                >
                  {news.data[0].category.name ?? "Kategori"}
                </Link>
              ) : (
                <span>
                  {typeof news.data[0].category === "string"
                    ? news.data[0].category
                    : (news.data[0].category?.name ?? "Kategori")}
                </span>
              )}
            </div>
            <ul className="blog-meta">
              <li className="meta-item blog-lesson">
                <span className="meta-value">
                  {" "}
                  <Moment format="dddd, Do MMMM YYYY">
                    {news.data[0].created_at}
                  </Moment>{" "}
                </span>
              </li>
              <li className="meta-item blog-students">
                <span className="meta-value">
                  {" "}
                  {Math.ceil(news.data[0].time_read / 10)} menit
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {news.data?.length > 0 &&
        news.data.map((item, index) => {
          if (index > 0)
            return (
              <div
                key={item._id}
                className="col-lg-6 col-md-6 item mt-5 pt-lg-3"
              >
                <div className="card">
                  <div className="card-header p-0 position-relative embed-responsive embed-responsive-1by1">
                    <Link href={`/news/${item.slug}`} legacyBehavior>
                      <img
                        className="card-img-bottom d-block radius-image embed-responsive-item"
                        style={{ objectFit: "cover" }}
                        src={item.mainImage}
                        alt={item.mainImage}
                      />
                    </Link>
                  </div>
                  <div className="card-body p-0 blog-details">
                    <Link href={`/news/${item.slug}`} className="blog-desc">
                      {item.title}
                    </Link>
                    <div className="text-truncate">
                      <div className="author align-items-center mt-3 mb-1">
                        {item.user && item.user._id ? (
                          <Link href={`/users/${item.user._id}`} legacyBehavior>
                            {item.user.name ?? "Penulis"}
                          </Link>
                        ) : (
                          <span>{item.user?.name ?? "Penulis"}</span>
                        )}{" "}
                        di{" "}
                        {item.category &&
                        typeof item.category !== "string" &&
                        item.category.slug ? (
                          <Link
                            href={`/newsCategories/${item.category.slug}`}
                            legacyBehavior
                          >
                            {item.category.name ?? "Kategori"}
                          </Link>
                        ) : (
                          <span>
                            {typeof item.category === "string"
                              ? item.category
                              : (item.category?.name ?? "Kategori")}
                          </span>
                        )}
                      </div>
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
                          {Math.ceil(item.time_read / 10)} menit
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            );
        })}

      <div className="pagination-wrapper mt-5">
        {news?.meta && (
          <ReactPaginate
            previousLabel={"<"}
            nextLabel={">"}
            breakLabel={"..."}
            initialPage={Math.max((news.meta.page || 1) - 1, 0)}
            pageCount={Math.max(
              Math.ceil((news.meta.total || 0) / (news.meta.limit || 1)),
              1
            )}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"page-pagination"}
            pageLinkClassName={"page-numbers"}
            activeLinkClassName={"active"}
          />
        )}
      </div>
    </div>
  );
};

export default connect(null, { getAllNews })(AllNewsItem);
