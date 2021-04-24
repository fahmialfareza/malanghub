const mongoose = require("mongoose");
const validator = require("validator");

exports.update = async (req, res, next) => {
  let errors = [];

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    errors.push("Please input a valid id");
  }

  if (!req.body.message) {
    errors.push("Please enter the message");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(", "),
    });
  }

  next();
};

exports.deleteNews = (req, res, next) => {
  try {
    let errors = [];

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errors.push("Please input a valid id");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    next();
  } catch (e) {
    return res.status(500).json({
      message: e.message,
    });
  }
};
