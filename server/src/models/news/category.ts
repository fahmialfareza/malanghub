import mongoose, { Document, Schema } from "mongoose";
import mongoose_delete from "mongoose-delete";
import slugify from "slugify";

// Interface for News Category
export interface INewsCategory extends Document {
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

// Create Mongoose Schema
const NewsCategorySchema: Schema<INewsCategory> = new mongoose.Schema(
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
      set: setSlug, // Slugify function
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

// Function to set the slug
function setSlug(slug: string): string {
  return slugify(slug, { lower: true, locale: "id" });
}

// Reverse populate with virtuals
NewsCategorySchema.virtual("news", {
  ref: "news",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

// Add `mongoose-delete` plugin to handle soft deletes
NewsCategorySchema.plugin(mongoose_delete, { overrideMethods: "all" });

// Create the Mongoose model
const NewsCategory = mongoose.model<INewsCategory>(
  "newsCategory",
  NewsCategorySchema
);

export default NewsCategory;
