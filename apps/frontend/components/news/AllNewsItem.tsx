import { connect } from "react-redux";
import { getAllNews } from "../../redux/actions/newsActions";
import { NewsWithPagination } from "../../models/news";
import { NewsGrid } from "./NewsCard";

interface AllNewsItemProps {
  news: NewsWithPagination;
  getAllNews: (page: number) => void;
}

const AllNewsItem = ({ news, getAllNews }: AllNewsItemProps) => (
  <NewsGrid news={news} onPageChange={(page) => getAllNews(page)} />
);

export default connect(null, { getAllNews })(AllNewsItem);
