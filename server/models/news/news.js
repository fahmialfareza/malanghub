const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const slugify = require("slugify");

const NewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      set: setSlug,
    },
    title: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "newsCategory",
      required: true,
    },
    time_read: {
      type: Number,
      required: true,
    },
    mainImage: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "newsTag",
      required: true,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: "process",
    },
    message: {
      type: String,
      required: false,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { getters: true, virtuals: true },
    toObject: { virtuals: true },
  }
);

function setSlug(slug) {
  return slugify(slug, { lower: true, locale: "id" });
}

NewsSchema.plugin(mongoose_delete, { overrideMethods: "all" });

const news = mongoose.model("news", NewsSchema);

module.exports = news;
