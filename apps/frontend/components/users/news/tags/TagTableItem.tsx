import { connect } from "react-redux";
import Moment from "react-moment";
import { Button } from "@malanghub/ui";
import { selectNewsTag } from "../../../../redux/actions/newsTagActions";
import { NewsTag } from "../../../../models/news";

interface TagTableItemProps {
  tag: NewsTag;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  selectNewsTag: (newsTag: NewsTag) => void;
}

const TagTableItem = ({
  tag,
  index,
  onEdit,
  onDelete,
  selectNewsTag,
}: TagTableItemProps) => {
  const onClickEdit = () => {
    if (tag) {
      selectNewsTag(tag);
    }

    onEdit();
  };

  const onClickDelete = () => {
    selectNewsTag(tag);

    onDelete();
  };

  return (
    <tr>
      <td className="tw:text-muted">{index + 1}</td>
      <td className="tw:font-semibold tw:text-fg">{tag.name}</td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{tag.created_at}</Moment>
      </td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{tag.created_at}</Moment>
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

export default connect(null, { selectNewsTag })(TagTableItem);
