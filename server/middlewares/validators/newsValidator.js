const mongoose = require("mongoose");
const validator = require("validator");

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Please input a valid id");
    }

    if (!req.body.message) {
      errors.push("Please enter the message");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    next();
  } catch (e) {
    return next(e);
  }
};

exports.deleteNews = (req, res, next) => {
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
