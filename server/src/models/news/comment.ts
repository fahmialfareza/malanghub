import mongoose, { Schema, Document } from "mongoose";
import mongoose_delete from "mongoose-delete";

/* Interface for News Comment Reply */
export interface INewsCommentReply extends Document {
  user: mongoose.Schema.Types.ObjectId;
  comment: string;
}

/* Interface for News Comment */
export interface INewsComment extends Document {
  user: mongoose.Schema.Types.ObjectId;
  news: mongoose.Schema.Types.ObjectId;
  comment: string;
  commentReplies: INewsCommentReply[];
  created_at?: Date;
  updated_at?: Date;
}

/* News Comment Reply Schema */
const NewsCommentReplySchema = new Schema<INewsCommentReply>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

/* News Comment Schema */
const NewsCommentSchema = new Schema<INewsComment>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    news: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "news",
    },
    comment: {
      type: String,
      required: true,
    },
    commentReplies: {
      type: [NewsCommentReplySchema],
      required: false,
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { getters: true },
  }
);

/* Apply mongoose-delete plugin */
NewsCommentSchema.plugin(mongoose_delete, { overrideMethods: "all" });

/* Model Definition */
const NewsComment = mongoose.model<INewsComment>(
  "NewsComment",
  NewsCommentSchema
);

export default NewsComment;
