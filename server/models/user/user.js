const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
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
      required: true,
      set: encryptPassword,
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

function encryptPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// Reverse populate with virtuals
UserSchema.virtual("news", {
  ref: "news",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

UserSchema.plugin(mongoose_delete, { overrideMethods: "all" });

const user = mongoose.model("user", UserSchema);

module.exports = user;
