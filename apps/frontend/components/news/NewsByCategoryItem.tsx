import { connect } from "react-redux";
import { getNewsByCategory } from "../../redux/actions/newsActions";
import { NewsWithPagination } from "../../models/news";
import { NewsGrid } from "./NewsCard";

interface NewsByCategoryItemProps {
  news: NewsWithPagination;
  getNewsByCategory: (id: string, page: number) => void;
  paramsId: string;
}

const NewsByCategoryItem = ({
  news,
  getNewsByCategory,
  paramsId,
}: NewsByCategoryItemProps) => (
  <NewsGrid
    news={news}
    onPageChange={(page) => getNewsByCategory(paramsId, page)}
  />
);

export default connect(null, { getNewsByCategory })(NewsByCategoryItem);
