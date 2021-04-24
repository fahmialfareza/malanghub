import { connect } from "react-redux";
import Moment from "react-moment";
import { selectNewsCategory } from "../../../../redux/actions/newsCategoryActions";

const CategoryTableItem = ({ category, index, selectNewsCategory }) => {
  const onClickEdit = (event) => {
    event.preventDefault();

    selectNewsCategory(category);

    window.$("#editNewsCategoryModal").modal("toggle");
  };

  const onClickDelete = (event) => {
    event.preventDefault();

    selectNewsCategory(category);

    window.$("#deleteNewsCategoryModal").modal("toggle");
  };

  return (
    <tr>
      <td>{index + 1}</td>
      <td>{category.name}</td>
      <td>
        <Moment format="MMMM Do, YYYY">{category.created_at}</Moment>
      </td>
      <td>
        <Moment format="MMMM Do, YYYY">{category.created_at}</Moment>
      </td>
      <td>
        <button
          className="btn btn-primary m-1"
          data-toggle="modal"
          data-target="#editNewsCategoryModal"
          onClick={onClickEdit}
        >
          <i className="fa fa-edit" aria-hidden="true"></i> Edit
        </button>
        <button
          className="btn btn-danger m-1"
          data-toggle="modal"
          data-target="#deleteNewsCategoryModal"
          onClick={onClickDelete}
        >
          <i className="fa fa-trash" aria-hidden="true"></i> Hapus
        </button>
      </td>
    </tr>
  );
};

export default connect(null, { selectNewsCategory })(CategoryTableItem);
