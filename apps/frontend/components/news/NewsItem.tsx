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
    <div className="grid gap-8 md:grid-cols-12">
      <div className="flex flex-col gap-6 md:col-span-7">
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
        <div className="flex flex-col gap-6 md:col-span-5 md:border-l md:border-line md:pl-8">
          {rest.map((item, index) => (
            <NewsCard
              key={item._id}
              news={item}
              variant="compact"
              className={
                index > 0 ? "border-t border-line pt-6" : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsItem;
