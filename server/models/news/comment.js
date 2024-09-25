const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const NewsCommentReplySchema = new mongoose.Schema(
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

const NewsCommentSchema = new mongoose.Schema(
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

NewsCommentSchema.plugin(mongoose_delete, { overrideMethods: "all" });

const newsComment = mongoose.model("newsComment", NewsCommentSchema);

module.exports = newsComment;
