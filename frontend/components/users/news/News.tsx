import { useState, useEffect } from "react";
import { connect } from "react-redux";
import AddNews from "./AddNews";
import EditNewsDraft from "./drafts/EditNewsDraft";
import DeleteNewsDraft from "./drafts/DeleteNewsDraft";
import AllNewsDraftTableItem from "./drafts/AllNewsDraftTableItem";
import NewsDraftTableItem from "./drafts/NewsDraftTableItem";
import NewsTableItem from "./NewsTableItem";
import EditNews from "./EditNews";
import Spinner from "../../layouts/Spinner";
import {
  getAllNewsDrafts,
  getMyNewsDrafts,
} from "../../../redux/actions/newsDraftActions";
import { getMyNews } from "../../../redux/actions/newsActions";
import { RootState } from "../../../redux/store";
import {
  LayoutReducerState,
  NewsDraftReducerState,
  NewsReducerState,
} from "../../../redux/types";
import { UserProfile } from "../../../models/user";

interface NewsProps {
  layout: LayoutReducerState;
  user: UserProfile;
  news: NewsReducerState;
  newsDraft: NewsDraftReducerState;
  getAllNewsDrafts: () => void;
  getMyNewsDrafts: () => void;
  getMyNews: () => void;
}

const News = ({
  layout: { theme },
  user,
  news: { myNews, loading: newsLoading },
  newsDraft: { allNewsDrafts, myNewsDrafts, loading: newsDraftLoading },
  getAllNewsDrafts,
  getMyNewsDrafts,
  getMyNews,
}: NewsProps) => {
  const [tableName, setTableName] = useState("Berita");

  useEffect(() => {
    getMyNews();
    getAllNewsDrafts();
    getMyNewsDrafts();
  }, []);

  return (
    <section
      id="news"
      className={"collapse mb-5 " + (!user?.role?.includes("admin") && "show")}
    >
      <section id="actions" className="py-4 mb-1">
        <div className="container">
          <div className="row">
            <div className="col-md-3 mb-2">
              <div className="dropdown">
                <button
                  className="btn btn-primary btn-block dropdown-toggle"
                  type="button"
                  id="dropdownMenuButton"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Berita
                </button>
                <div
                  className="dropdown-menu"
                  aria-labelledby="dropdownMenuButton"
                >
                  <a
                    href="#"
                    className="dropdown-item"
                    onClick={() => setTableName("Berita")}
                  >
                    Lihat Berita
                  </a>
                  <a
                    href="#"
                    className="dropdown-item"
                    data-toggle="modal"
                    data-target="#addNewsModal"
                  >
                    Tambah Berita
                  </a>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <a
                href="#"
                className="btn btn-primary btn-block"
                onClick={() => setTableName("Antrian Berita")}
              >
                Antrian Berita
              </a>
            </div>
            {user?.role?.includes("admin") && (
              <div className="col-md-3">
                <a
                  href="#"
                  className="btn btn-primary btn-block"
                  onClick={() => setTableName("Persetujuan Berita")}
                >
                  Persetujuan Berita
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="container">
        <div className="row">
          <div className="col-md-9 mb-2">
            <div className={theme === "dark" ? "card bg-dark" : "card"}>
              <div
                className={
                  theme === "dark" ? "card-header text-light" : "card-header"
                }
              >
                <h4>{tableName}</h4>
              </div>
              <div className="table-responsive">
                <table
                  className={
                    theme === "dark"
                      ? "table table-striped table-dark"
                      : "table table-striped"
                  }
                >
                  <thead
                    className={theme === "dark" ? "thead-dark" : "thead-light"}
                  >
                    <tr>
                      <th>ID</th>
                      <th>Judul</th>
                      {(tableName === "Antrian Berita" ||
                        tableName === "Persetujuan Berita") && (
                        <th>Pesan Dari Admin</th>
                      )}
                      {(tableName === "Antrian Berita" ||
                        tableName === "Persetujuan Berita") && <th>Status</th>}
                      <th>Dibuat</th>
                      <th>Diperbaharui</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableName === "Berita" && newsLoading ? (
                      <Spinner />
                    ) : (
                      tableName === "Berita" &&
                      myNews &&
                      myNews.map((news, index) => (
                        <NewsTableItem
                          key={news._id}
                          news={news}
                          index={index}
                        />
                      ))
                    )}
                    {tableName === "Antrian Berita" && newsDraftLoading ? (
                      <Spinner />
                    ) : (
                      tableName === "Antrian Berita" &&
                      myNewsDrafts &&
                      myNewsDrafts.map((draft, index) => (
                        <NewsDraftTableItem
                          key={draft._id}
                          draft={draft}
                          index={index}
                        />
                      ))
                    )}
                    {tableName === "Persetujuan Berita" && newsDraftLoading ? (
                      <Spinner />
                    ) : (
                      tableName === "Persetujuan Berita" &&
                      allNewsDrafts &&
                      allNewsDrafts.map((draft, index) => (
                        <AllNewsDraftTableItem
                          key={draft._id}
                          draft={draft}
                          index={index}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center bg-primary text-light mb-3">
              <div className="card-body">
                <h3 style={{ color: "#f8f9fa" }}>Berita</h3>
                <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                  <i className="fa fa-pencil-alt" aria-hidden="true"></i>{" "}
                  {newsLoading ? <Spinner /> : myNews ? myNews.length : 0}
                </h4>
                <a
                  href="#"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setTableName("Berita")}
                >
                  Lihat
                </a>
              </div>
            </div>
            <div className="card text-center bg-primary text-light mb-3">
              <div className="card-body">
                <h3 style={{ color: "#f8f9fa" }}>Antrian Berita</h3>
                <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                  <i className="fa fa-pencil-alt" aria-hidden="true"></i>{" "}
                  {newsDraftLoading ? (
                    <Spinner />
                  ) : myNewsDrafts ? (
                    myNewsDrafts.length
                  ) : (
                    0
                  )}
                </h4>
                <a
                  href="#"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setTableName("Antrian Berita")}
                >
                  Lihat
                </a>
              </div>
            </div>
            {user?.role?.includes("admin") && (
              <div className="card text-center bg-primary text-light mb-3">
                <div className="card-body">
                  <h3 style={{ color: "#f8f9fa" }}>Persetujuan Berita</h3>
                  <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                    <i className="fa fa-pencil-alt" aria-hidden="true"></i>{" "}
                    {newsDraftLoading ? (
                      <Spinner />
                    ) : allNewsDrafts ? (
                      allNewsDrafts.length
                    ) : (
                      0
                    )}
                  </h4>
                  <a
                    href="#"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setTableName("Persetujuan Berita")}
                  >
                    Lihat
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddNews />

      <DeleteNewsDraft />

      <EditNewsDraft />

      <EditNews />
    </section>
  );
};

const mapStateToProps = (state: RootState) => ({
  layout: state.layout,
  newsDraft: state.newsDraft,
  news: state.news,
});

export default connect(mapStateToProps, {
  getAllNewsDrafts,
  getMyNewsDrafts,
  getMyNews,
})(News);
