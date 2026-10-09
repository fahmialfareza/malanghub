import { News } from "../../models/news";
import { NumberedNewsItem } from "./NewsCard";

interface TrendingNewsProps {
  news: News;
  index: number;
}

const TrendingNews = ({ news, index }: TrendingNewsProps) => (
  <NumberedNewsItem news={news} index={index} />
);

export default TrendingNews;
