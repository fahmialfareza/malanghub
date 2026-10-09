import Link from "next/link";
import { buttonClass } from "@malanghub/ui";
import { News } from "../../models/news";
import { NewsCard } from "./NewsCard";

interface NewsItemProps {
  news: News[];
}

/** Home page: the newest story as a hero, the next ones as a compact list. */
const NewsItem = ({ news }: NewsItemProps) => {
  const [hero, ...rest] = news;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <NewsCard news={hero} variant="featured" headingLevel="h2" priority />
        <Link
          href="/news"
          className={buttonClass({
            variant: "secondary",
            className: "self-start",
          })}
        >
          Semua Berita
          <span className="fa fa-arrow-right" aria-hidden="true"></span>
        </Link>
      </div>
      {rest.length > 0 && (
        <div className="grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
          {rest.map((item) => (
            <NewsCard key={item._id} news={item} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsItem;
