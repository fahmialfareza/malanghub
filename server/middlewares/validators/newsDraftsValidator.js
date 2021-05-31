const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const mongoose = require("mongoose");
const { news, newsCategory, newsTag } = require("../../models");
const { awsNewsUpload } = require("../../utils/amazons3");

exports.create = async (req, res, next) => {
  try {
    let errors = [];

    if (!req.body.title) {
      errors.push("Please enter title");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Please input a valid category id");
    }

    if (!req.body.content) {
      errors.push("Content is required");
    }

    if (!req.files) {
      errors.push("Main Image is required");
    }

    tags = [];

    req.body.tags.split(",").map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push("Please input a valid tag id");
      }

      tags.push({ _id: id });
    });

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    let findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ $or: tags }),
    ]);

    if (!findData[0]) {
      errors.push("News Category not found");
    }

    if (findData[1].length < tags.length) {
      errors.push("News Tags not found");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    // Check image
    if (req.files) {
      const file = req.files.mainImage;

      // Make sure image is photo
      if (!file.mimetype.startsWith("image")) {
        errors.push("File must be an image");
      }

      // Check file size (max 1MB)
      if (file.size > 1000000) {
        errors.push("Image must be less than 1MB");
      }

      if (errors.length > 0) {
        return next({ message: errors.join(","), statusCode: 400 });
      }

      // Create custom filename
      let fileName = crypto.randomBytes(16).toString("hex");

      // Rename the file
      file.name = `${fileName}${path.parse(file.name).ext}`;

      req.body.mainImage = await awsNewsUpload(file);
    }

    req.body.time_read = eval(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.user = req.user.id;

    next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!req.body.title) {
      errors.push("Please enter title");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Please input a valid id");
    }

    if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
      errors.push("Please input a valid category id");
    }

    if (!req.body.content) {
      errors.push("Content is required");
    }

    tags = [];

    req.body.tags.split(",").map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push("Please input a valid tag id");
      }

      tags.push({ _id: id });
    });

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    let findData = await Promise.all([
      newsCategory.findById(req.body.category),
      newsTag.find({ $or: tags }),
    ]);

    if (!findData[0]) {
      errors.push("News Category not found");
    }

    if (findData[1].length < tags.length) {
      errors.push("News Tags not found");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    // Check image
    if (req.files) {
      const file = req.files.mainImage;

      // Make sure image is photo
      if (!file.mimetype.startsWith("image")) {
        errors.push("File must be an image");
      }

      // Check file size (max 1MB)
      if (file.size > 1000000) {
        errors.push("Image must be less than 1MB");
      }

      if (errors.length > 0) {
        return next({ message: errors.join(","), statusCode: 400 });
      }

      // Create custom filename
      let fileName = crypto.randomBytes(16).toString("hex");

      // Rename the file
      file.name = `${fileName}${path.parse(file.name).ext}`;

      req.body.mainImage = await awsNewsUpload(file);
    }

    req.body.time_read = eval(req.body.content.length / 100);
    req.body.slug = req.body.title;
    req.body.tags = tags;
    req.body.status = "process";

    next();
  } catch (e) {
    return next(e);
  }
};

exports.deleteNewsDraft = (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Please input a valid id");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    next();
  } catch (e) {
    return next(e);
  }
};
