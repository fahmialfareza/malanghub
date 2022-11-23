import { connect } from "react-redux";
import Moment from "react-moment";
import { selectNewsTag } from "../../../../redux/actions/newsTagActions";

const TagTableItem = ({ tag, index, selectNewsTag }) => {
  const onClickEdit = (event) => {
    event.preventDefault();

    selectNewsTag(tag);

    window.$("#editNewsTagModal").modal("toggle");
  };

  const onClickDelete = (event) => {
    event.preventDefault();

    selectNewsTag(tag);

    window.$("#deleteNewsTagModal").modal("toggle");
  };

  return (
    <tr>
      <td>{index + 1}</td>
      <td>{tag.name}</td>
      <td>
        <Moment format="MMMM Do, YYYY">{tag.created_at}</Moment>
      </td>
      <td>
        <Moment format="MMMM Do, YYYY">{tag.created_at}</Moment>
      </td>
      <td>
        <button
          className="btn btn-primary m-1"
          data-toggle="modal"
          data-target="#editNewsTagModal"
          onClick={onClickEdit}
        >
          <i className="fa fa-edit" aria-hidden="true"></i> Edit
        </button>
        <button
          className="btn btn-danger m-1"
          data-toggle="modal"
          data-target="#deleteNewsTagModal"
          onClick={onClickDelete}
        >
          <i className="fa fa-trash" aria-hidden="true"></i> Hapus
        </button>
      </td>
    </tr>
  );
};

export default connect(null, { selectNewsTag })(TagTableItem);
