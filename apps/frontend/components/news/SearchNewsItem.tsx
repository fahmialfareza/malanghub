import { connect } from "react-redux";
import { getNewsBySearch } from "../../redux/actions/newsActions";
import { NewsWithPagination } from "../../models/news";
import { NewsGrid } from "./NewsCard";

interface SearchNewsItemProps {
  news: NewsWithPagination;
  getNewsBySearch: (search: string, page: number) => void;
  search: string;
}

const SearchNewsItem = ({
  news,
  getNewsBySearch,
  search,
}: SearchNewsItemProps) => (
  <NewsGrid
    news={news}
    onPageChange={(page) => getNewsBySearch(search, page)}
  />
);

export default connect(null, { getNewsBySearch })(SearchNewsItem);
