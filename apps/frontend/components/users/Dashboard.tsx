import { connect } from "react-redux";
import Categories from "./news/categories/Categories";
import Tags from "./news/tags/Tags";
import News from "./news/News";
import Spinner from "../layouts/Spinner";
import { RootState } from "../../redux/store";
import { UserReducerState } from "../../redux/types";

interface DashboardProps {
  user: UserReducerState;
}

const Dashboard = ({
  user: { user, loading: userLoading },
}: DashboardProps) => {
  return (
    <>
      <header id="main-header" className="py-2">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h1>
                <i className="fa fa-cog" aria-hidden="true"></i> Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <section id="actions" className="py-4 mb-4">
        <div className="container">
          <div className="row justify-content-center">
            {userLoading ? (
              <Spinner />
            ) : (
              user &&
              user?.role &&
              user?.role?.includes("admin") && (
                <div className="col">
                  <a
                    href="#"
                    className="port-item btn btn-primary btn-block"
                    data-toggle="collapse"
                    data-target="#category"
                    onClick={() => {
                      // @ts-ignore
                      window.$(".collapse").collapse("hide");
                    }}
                  >
                    <i className="fa fa-list-alt" aria-hidden="true"></i>{" "}
                    Kategori
                  </a>
                </div>
              )
            )}
            {userLoading ? (
              <Spinner />
            ) : (
              user &&
              user?.role &&
              user?.role?.includes("admin") && (
                <div className="col">
                  <a
                    href="#"
                    className="port-item btn btn-primary btn-block"
                    data-toggle="collapse"
                    data-target="#tag"
                    onClick={() => {
                      // @ts-ignore
                      window.$(".collapse").collapse("hide");
                    }}
                  >
                    <i className="fa fa-tag" aria-hidden="true"></i> Tag
                  </a>
                </div>
              )
            )}
            <div className="col">
              <a
                href="#"
                className="port-item btn btn-primary btn-block"
                data-toggle="collapse"
                data-target="#news"
                onClick={() => {
                  // @ts-ignore
                  window.$(".collapse").collapse("hide");
                }}
              >
                <i className="fa fa-newspaper-o" aria-hidden="true"></i> Berita
              </a>
            </div>
          </div>
        </div>
      </section>

      {userLoading ? (
        <Spinner />
      ) : (
        user && user?.role && user?.role?.includes("admin") && <Categories />
      )}

      {userLoading ? (
        <Spinner />
      ) : (
        user && user?.role && user?.role?.includes("admin") && <Tags />
      )}

      {userLoading ? <Spinner /> : user && <News user={user} />}
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  user: state.user,
});

export default connect(mapStateToProps, {})(Dashboard);
