const validator = require("validator");
const mongoose = require("mongoose");

const logger = require("../../utils/logger");

exports.create = (req, res, next) => {
  try {
    let errors = [];

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    req.body.slug = req.body.name;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!validator.isAlpha(validator.blacklist(req.body.name, " "))) {
      errors.push("Silahkan masukkan nama");
    }

    if (errors.length > 0) {
      return next({ message: errors.join(", "), statusCode: 400 });
    }

    req.body.slug = req.body.name;

    next();
  } catch (e) {
    logger.error(e);
    return next(e);
  }
};

exports.deleteTag = (req, res, next) => {
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
    logger.error(e);
    return next(e);
  }
};
