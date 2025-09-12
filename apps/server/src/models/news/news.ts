import mongoose, { Schema, Document } from "mongoose";
import mongoose_delete from "mongoose-delete";
import slugify from "slugify";

/* Interface for News */
export interface INews extends Document {
  user: mongoose.Schema.Types.ObjectId;
  slug: string;
  title: string;
  category: mongoose.Schema.Types.ObjectId;
  time_read: number;
  mainImage: string;
  content: string;
  tags: mongoose.Schema.Types.ObjectId[];
  views: number;
  status: string;
  message?: string;
  approved: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/* News Schema */
const NewsSchema = new Schema<INews>(
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
      set: (slug: string) => setSlug(slug),
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

/* Slug function */
function setSlug(slug: string): string {
  return slugify(slug, { lower: true, locale: "id" });
}

/* Apply mongoose-delete plugin */
NewsSchema.plugin(mongoose_delete, { overrideMethods: "all" });

/* Model Definition */
const News = mongoose.model<INews>("news", NewsSchema);

export default News;
