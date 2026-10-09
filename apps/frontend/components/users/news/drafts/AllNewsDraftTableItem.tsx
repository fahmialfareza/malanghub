import { useEffect } from "react";
import Link from "next/link";
import { connect } from "react-redux";
import Moment from "react-moment";
import { Badge, Button, buttonClass } from "@malanghub/ui";
import {
  selectNewsDraft,
  getAllNewsDrafts,
} from "../../../../redux/actions/newsDraftActions";
import { News } from "../../../../models/news";

interface AllNewsDraftTableItemProps {
  draft: News;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  selectNewsDraft: (newsDraft: News) => void;
  getAllNewsDrafts: () => void;
}

const AllNewsDraftTableItem = ({
  draft,
  index,
  onEdit,
  onDelete,
  selectNewsDraft,
  getAllNewsDrafts,
}: AllNewsDraftTableItemProps) => {
  useEffect(() => {
    getAllNewsDrafts();
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
      <td className="tw:text-muted">{index + 1}</td>
      <td className="tw:min-w-48 tw:font-semibold tw:text-fg">{draft.title}</td>
      <td className="tw:min-w-48">
        {draft.message
          ? draft.message
          : "Silahkan Tunggu Konfirmasi dari Admin"}
      </td>
      <td>
        {draft.status === "process" ? (
          <Badge tone="warning" className="tw:whitespace-nowrap">
            Sedang Diproses Admin
          </Badge>
        ) : (
          <Badge tone="danger" className="tw:whitespace-nowrap">
            Admin Meminta Revisi
          </Badge>
        )}
      </td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td className="tw:whitespace-nowrap">
        <Moment format="MMMM Do, YYYY">{draft.created_at}</Moment>
      </td>
      <td>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <Link
            href={`/users/newsDrafts/${draft.slug}`}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            <i className="fa fa-search-plus" aria-hidden="true"></i> Pratinjau
          </Link>
          <Button size="sm" onClick={onClickEdit}>
            <i className="fa fa-edit" aria-hidden="true"></i> Persetujuan
          </Button>
          <Button size="sm" variant="danger" onClick={onClickDelete}>
            <i className="fa fa-trash" aria-hidden="true"></i> Hapus
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default connect(null, { selectNewsDraft, getAllNewsDrafts })(
  AllNewsDraftTableItem
);
