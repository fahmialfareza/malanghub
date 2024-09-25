import mongoose, { Schema, Document } from "mongoose";
import mongoose_delete from "mongoose-delete";
import slugify from "slugify";

/* Interface for News Tag */
export interface INewsTag extends Document {
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

/* News Tag Schema */
const NewsTagSchema = new Schema<INewsTag>(
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
      set: (slug: string) => setSlug(slug),
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

/* Function to set slug using slugify */
function setSlug(slug: string): string {
  return slugify(slug, { lower: true, locale: "id" });
}

/* Virtual for reverse populate */
NewsTagSchema.virtual("news", {
  ref: "news",
  localField: "_id",
  foreignField: "tags",
  justOne: false,
});

/* Apply mongoose-delete plugin */
NewsTagSchema.plugin(mongoose_delete, { overrideMethods: "all" });

/* Model Definition */
const NewsTag = mongoose.model<INewsTag>("NewsTag", NewsTagSchema);

export default NewsTag;
