import { useEffect } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import { Badge, Button, buttonClass } from "@malanghub/ui";
import {
  selectNewsDraft,
  getMyNewsDrafts,
} from "../../../../redux/actions/newsDraftActions";
import { News } from "../../../../models/news";

interface NewsDraftTableItemProps {
  draft: News;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  selectNewsDraft: (newsDraft: News) => void;
  getMyNewsDrafts: () => void;
}

const NewsDraftTableItem = ({
  draft,
  index,
  onEdit,
  onDelete,
  selectNewsDraft,
  getMyNewsDrafts,
}: NewsDraftTableItemProps) => {
  useEffect(() => {
    getMyNewsDrafts();
  }, []);

  const onClickEdit = () => {
    selectNewsDraft(draft);
    onEdit();
  };

  const onClickDelete = () => {
    selectNewsDraft(draft);
    onDelete();
  };

  return (
    <tr>
      <td className="text-muted">{index + 1}</td>
      <td className="min-w-48 font-semibold text-fg">{draft.title}</td>
      <td className="min-w-48">
        {draft.message
          ? draft.message
          : "Silahkan Tunggu Konfirmasi dari Admin"}
      </td>
      <td>
        {draft.status === "process" ? (
          <Badge tone="warning" className="whitespace-nowrap">
            Sedang Diproses Admin
          </Badge>
        ) : (
          <Badge tone="danger" className="whitespace-nowrap">
            Admin Meminta Revisi
          </Badge>
        )}
      </td>
      <td className="whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td className="whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td>
        <div className="flex justify-end gap-2">
          <Link
            href={`/users/newsDrafts/${draft.slug}`}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            <i className="fa fa-search-plus" aria-hidden="true"></i> Pratinjau
          </Link>
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

export default connect(null, { selectNewsDraft, getMyNewsDrafts })(
  NewsDraftTableItem
);
