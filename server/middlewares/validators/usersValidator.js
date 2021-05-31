const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const mongoose = require("mongoose");
const { user } = require("../../models");
const { awsUserUpload } = require("../../utils/amazons3");

exports.updateProfile = async (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Please enter your name");
    }

    // Check image
    if (req.files) {
      const file = req.files.photo;

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

      req.body.photo = await awsUserUpload(file);
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    next();
  } catch (e) {
    return next(e);
  }
};

exports.getUser = (req, res, next) => {
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

exports.signup = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Please enter your name");
    }

    if (!validator.isEmail(req.body.email)) {
      errors.push("Please enter valid email address");
    }

    if (!validator.isStrongPassword(req.body.password, { minSymbols: 0 })) {
      errors.push("Password must be stronger");
    }

    if (req.body.passwordConfirmation !== req.body.password) {
      errors.push("Password Confirmation field must be same to Password field");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    return next(e);
  }
};

exports.signin = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isEmail(req.body.email)) {
      errors.push("Please enter valid email address");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    return next(e);
  }
};
