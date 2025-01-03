import { MouseEvent, useEffect } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import {
  selectNewsDraft,
  getAllNewsDrafts,
} from "../../../../redux/actions/newsDraftActions";
import { News } from "../../../../models/news";

interface AllNewsDraftTableItemProps {
  draft: News;
  index: number;
  selectNewsDraft: (newsDraft: News) => void;
  getAllNewsDrafts: () => void;
}

const AllNewsDraftTableItem = ({
  draft,
  index,
  selectNewsDraft,
  getAllNewsDrafts,
}: AllNewsDraftTableItemProps) => {
  useEffect(() => {
    getAllNewsDrafts();
  }, []);

  const onClickEdit = (event: MouseEvent) => {
    event.preventDefault();

    selectNewsDraft(draft);

    // @ts-ignore
    window.$("#editNewsModal").modal("toggle");
  };

  const onClickDelete = (event: MouseEvent) => {
    event.preventDefault();

    selectNewsDraft(draft);

    // @ts-ignore
    window.$("#deleteNewsDraftModal").modal("toggle");
  };

  return (
    <tr>
      <td>{index + 1}</td>
      <td>{draft.title}</td>
      <td>
        {draft.message
          ? draft.message
          : "Silahkan Tunggu Konfirmasi dari Admin"}
      </td>
      <td>
        {draft.status === "process" ? (
          <button className="btn btn-success btn-block">
            Sedang Diproses Admin
          </button>
        ) : (
          <button className="btn btn-danger btn-block">
            Admin Meminta Revisi
          </button>
        )}
      </td>
      <td>
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td>
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td>
        <Link
          href={`/users/newsDrafts/${draft.slug}`}
          className="btn btn-outline-primary m-1"
        >
          <i className="fa fa-search-plus" aria-hidden="true"></i>Pratinjau
        </Link>
        <button
          className="btn btn-primary m-1"
          data-toggle="modal"
          data-target="#editNewsModal"
          onClick={onClickEdit}
        >
          <i className="fa fa-edit" aria-hidden="true"></i> Persetujuan
        </button>
        <button
          className="btn btn-danger m-1"
          data-toggle="modal"
          data-target="#deleteNewsDraftModal"
          onClick={onClickDelete}
        >
          <i className="fa fa-trash" aria-hidden="true"></i> Hapus
        </button>
      </td>
    </tr>
  );
};

export default connect(null, { selectNewsDraft, getAllNewsDrafts })(
  AllNewsDraftTableItem
);
