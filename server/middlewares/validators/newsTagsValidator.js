const validator = require("validator");
const mongoose = require("mongoose");
const { newsTag } = require("../../models");

exports.create = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Please enter name");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    req.body.slug = req.body.name;

    next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Please input a valid id");
    }

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Please enter name");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(","), statusCode: 400 });
    }

    req.body.slug = req.body.name;

    next();
  } catch (e) {
    return next(e);
  }
};

exports.deleteTag = (req, res, next) => {
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
