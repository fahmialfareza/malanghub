const mongoose = require("mongoose");
const validator = require("validator");

const logger = require("../../utils/logger");

exports.update = async (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Silahkan masukkan id yang benar");
    }

    if (!req.body.message) {
      errors.push("Silahkan masukkan pesan");
    }

    if (!req.body.title) {
      errors.push("Judul tidak boleh kosong");
    }

    if (!req.body.content) {
      errors.push("Konten tidak boleh kosong");
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

exports.deleteNews = (req, res, next) => {
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
