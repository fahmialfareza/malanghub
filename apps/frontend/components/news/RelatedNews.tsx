import { News } from "../../models/news";
import { NewsCard } from "./NewsCard";

interface RelatedNewsProps {
  news: News;
  index: number;
}

const RelatedNews = ({ news }: RelatedNewsProps) => <NewsCard news={news} />;

export default RelatedNews;
