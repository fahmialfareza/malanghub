import mongoose, { Schema, Document, ObjectId } from "mongoose";
import mongoose_delete from "mongoose-delete";
import bcrypt from "bcrypt";

/* Interface for User */
export interface IUser extends Document {
  _id: ObjectId;
  id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: string;
  photo?: string;
  motto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  created_at?: Date;
  updated_at?: Date;
}

/* User Schema */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      set: (password: string) => encryptPassword(password),
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    photo: {
      type: String,
      required: false,
    },
    motto: {
      type: String,
      required: false,
    },
    bio: {
      type: String,
      required: false,
    },
    instagram: {
      type: String,
      required: false,
    },
    facebook: {
      type: String,
      required: false,
    },
    twitter: {
      type: String,
      required: false,
    },
    tiktok: {
      type: String,
      required: false,
    },
    linkedin: {
      type: String,
      required: false,
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

/* Function to encrypt the password */
function encryptPassword(password: string): string {
  if (!password) return "";
  return bcrypt.hashSync(password, 10);
}

/* Virtual field for reverse populate */
UserSchema.virtual("news", {
  ref: "news",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

/* Apply mongoose-delete plugin */
UserSchema.plugin(mongoose_delete, { overrideMethods: "all" });

/* Model Definition */
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
