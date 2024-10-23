import { connect } from "react-redux";
import Moment from "react-moment";
import { selectNewsTag } from "../../../../redux/actions/newsTagActions";
import { NewsTag } from "../../../../models/news";
import { MouseEvent } from "react";

interface TagTableItemProps {
  tag: NewsTag;
  index: number;
  selectNewsTag: (newsTag: NewsTag) => void;
}

const TagTableItem = ({ tag, index, selectNewsTag }: TagTableItemProps) => {
  const onClickEdit = (event: MouseEvent) => {
    event.preventDefault();

    if (tag) {
      selectNewsTag(tag);
    }

    // @ts-ignore
    window.$("#editNewsTagModal").modal("toggle");
  };

  const onClickDelete = (event: MouseEvent) => {
    event.preventDefault();

    selectNewsTag(tag);

    // @ts-ignore
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
