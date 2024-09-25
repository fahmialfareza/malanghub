const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const slugify = require("slugify");

const NewsCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      set: setSlug,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

function setSlug(slug) {
  return slugify(slug, { lower: true, locale: "id" });
}

// Reverse populate with virtuals
NewsCategorySchema.virtual("news", {
  ref: "news",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

NewsCategorySchema.plugin(mongoose_delete, { overrideMethods: "all" });

const newsCategory = mongoose.model("newsCategory", NewsCategorySchema);

module.exports = newsCategory;
