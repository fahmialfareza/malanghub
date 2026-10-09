import { connect } from "react-redux";
import { getNewsByTag } from "../../redux/actions/newsActions";
import { NewsWithPagination } from "../../models/news";
import { NewsGrid } from "./NewsCard";

interface NewsByTagItemProps {
  news: NewsWithPagination;
  getNewsByTag: (id: string, page: number) => void;
  paramsId: string;
}

const NewsByTagItem = ({
  news,
  getNewsByTag,
  paramsId,
}: NewsByTagItemProps) => (
  <NewsGrid news={news} onPageChange={(page) => getNewsByTag(paramsId, page)} />
);

export default connect(null, { getNewsByTag })(NewsByTagItem);
