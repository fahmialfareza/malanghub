const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const mongoose = require("mongoose");
const { uploader } = require("../../utils/cloudinary");

exports.updateProfile = async (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama Anda");
    }

    // Check image
    if (req.files) {
      const file = req.files.photo;

      // Make sure image is photo
      if (!file.mimetype.startsWith("image")) {
        errors.push("File haruslah sebuah gambar");
      }

      // Check file size (max 1MB)
      if (file.size > 1000000) {
        errors.push("Gambar harus kurang dari 1 MB");
      }

      if (errors.length > 0) {
        return next({ message: errors.join(", "), statusCode: 400 });
      }

      // Create custom filename
      let fileName = crypto.randomBytes(16).toString("hex");

      // Rename the file
      file.name = `${fileName}${path.parse(file.name).ext}`;

      const imageUpload = await uploader(file);
      req.body.photo = imageUpload.secure_url;
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
};

exports.getUser = (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
};

exports.signup = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama Anda");
    }

    if (!validator.isEmail(req.body.email)) {
      errors.push("Silahkan masukkan email yang valid");
    }

    if (!validator.isStrongPassword(req.body.password, { minSymbols: 0 })) {
      errors.push("Password kurang kuat");
    }

    if (req.body.passwordConfirmation !== req.body.password) {
      errors.push("Password harus sama dengan Password Konfirmasi");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
};

exports.signin = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isEmail(req.body.email)) {
      errors.push("Silahkan masukkan email yang valid");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    if (req.body.password.includes("Google")) {
      req.body.password = req.body.password.slice(6);
    }

    if (req.body.password.includes("Facebook")) {
      req.body.password = req.body.password.slice(8);
    }

    next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
};

exports.google = (req, res, next) => {
  try {
    let errors = [];

    if (validator.isEmpty(req.body.access_token)) {
      errors.push("Silahkan masukkan access token yang valid");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    next();
  } catch (error) {
    console.error(e);
    return next(e);
  }
};
