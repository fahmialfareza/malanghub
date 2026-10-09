import { useState } from "react";
import { connect } from "react-redux";
import { Card, Container, LoadingBlock, cx } from "@malanghub/ui";
import Categories from "./news/categories/Categories";
import Tags from "./news/tags/Tags";
import News from "./news/News";
import { RootState } from "../../redux/store";
import { UserReducerState } from "../../redux/types";

interface DashboardProps {
  user: UserReducerState;
}

type DashboardSection = "category" | "tag" | "news";

const sectionTabs: {
  key: DashboardSection;
  label: string;
  icon: string;
  adminOnly: boolean;
}[] = [
  { key: "category", label: "Kategori", icon: "fa-list-alt", adminOnly: true },
  { key: "tag", label: "Tag", icon: "fa-tag", adminOnly: true },
  { key: "news", label: "Berita", icon: "fa-newspaper-o", adminOnly: false },
];

const Dashboard = ({
  user: { user, loading: userLoading },
}: DashboardProps) => {
  const isAdmin = !!user?.role?.includes("admin");
  const [selected, setSelected] = useState<DashboardSection | null>(null);

  const tabs = sectionTabs.filter((tab) => isAdmin || !tab.adminOnly);
  // Admins land on categories, everyone else on their news.
  const active: DashboardSection =
    selected && tabs.some((tab) => tab.key === selected)
      ? selected
      : isAdmin
        ? "category"
        : "news";

  return (
    <section className="tw:bg-bg tw:pb-12">
      <Container>
        <Card className="tw:mb-6 tw:p-4 tw:sm:p-5">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
            <h2 className="tw:m-0 tw:flex tw:items-center tw:gap-2 tw:font-heading tw:text-xl tw:font-semibold tw:text-fg tw:sm:text-2xl">
              <i className="fa fa-cog tw:text-brand" aria-hidden="true"></i>
              Dashboard
            </h2>
            {!userLoading && user && (
              <div
                role="tablist"
                aria-label="Bagian dashboard"
                className="tw:flex tw:gap-1 tw:overflow-x-auto tw:rounded-xl tw:bg-surface-2 tw:p-1"
              >
                {tabs.map((tab) => {
                  const isActive = tab.key === active;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      id={`dashboard-tab-${tab.key}`}
                      aria-selected={isActive}
                      aria-controls={`dashboard-panel-${tab.key}`}
                      onClick={() => setSelected(tab.key)}
                      className={cx(
                        "tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-2 tw:whitespace-nowrap tw:rounded-lg tw:border-0 tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring tw:sm:flex-none",
                        isActive
                          ? "tw:bg-surface tw:text-brand tw:shadow-card"
                          : "tw:bg-transparent tw:text-muted tw:hover:text-fg",
                      )}
                    >
                      <i className={`fa ${tab.icon}`} aria-hidden="true"></i>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </Container>

      {userLoading ? (
        <LoadingBlock />
      ) : (
        user && (
          <>
            {/* Sections stay mounted so their data and form state survive tab switches. */}
            {isAdmin && (
              <div
                role="tabpanel"
                id="dashboard-panel-category"
                aria-labelledby="dashboard-tab-category"
                hidden={active !== "category"}
              >
                <Categories />
              </div>
            )}
            {isAdmin && (
              <div
                role="tabpanel"
                id="dashboard-panel-tag"
                aria-labelledby="dashboard-tab-tag"
                hidden={active !== "tag"}
              >
                <Tags />
              </div>
            )}
            <div
              role="tabpanel"
              id="dashboard-panel-news"
              aria-labelledby="dashboard-tab-news"
              hidden={active !== "news"}
            >
              <News user={user} />
            </div>
          </>
        )
      )}
    </section>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, {})(Dashboard);
