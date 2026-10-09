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
    <section className="bg-bg pb-12">
      <Container>
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="m-0 flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
              <i className="fa fa-cog text-brand" aria-hidden="true"></i>
              Dashboard
            </h2>
            {!userLoading && user && (
              <div
                role="tablist"
                aria-label="Bagian dashboard"
                className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1"
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
                        "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring sm:flex-none",
                        isActive
                          ? "bg-surface text-brand shadow-card"
                          : "bg-transparent text-muted hover:text-fg",
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
