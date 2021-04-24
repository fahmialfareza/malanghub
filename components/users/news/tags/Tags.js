import { useEffect } from "react";
import { connect } from "react-redux";
import { getNewsTags } from "../../../../redux/actions/newsTagActions";
import TagTableItem from "./TagTableItem";
import AddTag from "./AddTag";
import EditTag from "./EditTag";
import DeleteTag from "./DeleteTag";
import Alert from "../../../layouts/Alert";

const Tags = ({ newsTag: { newsTags }, layout: { theme }, getNewsTags }) => {
  useEffect(() => {
    getNewsTags();
  }, []);

  return (
    <>
      <section id="tag" className="collapse mb-5">
        <section id="actions" className="py-4 mb-1">
          <div className="container">
            <div className="row">
              <div className="col-md-3">
                <a
                  href="#"
                  className="btn btn-primary btn-block"
                  data-toggle="modal"
                  data-target="#addNewsTagModal"
                >
                  <i className="fa fa-plus" aria-hidden="true"></i> Tambah Tag
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <Alert />
          <div className="row">
            <div className="col-md-9 mb-2">
              <div className={theme === "dark" ? "card bg-dark" : "card"}>
                <div
                  className={
                    theme === "dark" ? "card-header text-light" : "card-header"
                  }
                >
                  <h4>Tag (Berita)</h4>
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
                      className={
                        theme === "dark" ? "thead-dark" : "thead-light"
                      }
                    >
                      <tr>
                        <th>ID</th>
                        <th>Nama Tag</th>
                        <th>Dibuat</th>
                        <th>Diperbaharui</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsTags &&
                        newsTags.map((tag, index) => (
                          <TagTableItem key={tag._id} tag={tag} index={index} />
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center bg-primary text-light mb-3">
                <div className="card-body">
                  <h3 style={{ color: "#f8f9fa" }}>Tag</h3>
                  <h4 className="display-4 mb-2" style={{ color: "#f8f9fa" }}>
                    <i className="fa fa-pencil-alt" aria-hidden="true"></i>{" "}
                    {newsTags ? newsTags.length : 0}
                  </h4>
                  <a
                    href="#"
                    className="port-item btn btn btn-outline-light btn-sm"
                    data-toggle="collapse"
                    data-target="#tag"
                  >
                    Lihat
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddTag />

      <EditTag />

      <DeleteTag />
    </>
  );
};

const mapStateToProps = (state) => ({
  newsTag: state.newsTag,
  layout: state.layout,
});

export default connect(mapStateToProps, { getNewsTags })(Tags);
