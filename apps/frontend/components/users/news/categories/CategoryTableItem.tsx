import { connect } from "react-redux";
import Moment from "react-moment";
import { Button } from "@malanghub/ui";
import { selectNewsCategory } from "../../../../redux/actions/newsCategoryActions";
import { NewsCategory } from "../../../../models/news";

interface CategoryTableItemProps {
  category: NewsCategory;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  selectNewsCategory: (newsCategory: NewsCategory) => void;
}

const CategoryTableItem = ({
  category,
  index,
  onEdit,
  onDelete,
  selectNewsCategory,
}: CategoryTableItemProps) => {
  const onClickEdit = () => {
    selectNewsCategory(category);
    onEdit();
  };

  const onClickDelete = () => {
    selectNewsCategory(category);
    onDelete();
  };

  return (
    <tr>
      <td className="tw:text-muted">{index + 1}</td>
      <td className="tw:font-semibold tw:text-fg">{category.name}</td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{category.created_at}</Moment>
      </td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{category.created_at}</Moment>
      </td>
      <td>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <Button size="sm" variant="secondary" onClick={onClickEdit}>
            <i className="fa fa-edit" aria-hidden="true"></i> Edit
          </Button>
          <Button size="sm" variant="danger" onClick={onClickDelete}>
            <i className="fa fa-trash" aria-hidden="true"></i> Hapus
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default connect(null, { selectNewsCategory })(CategoryTableItem);
