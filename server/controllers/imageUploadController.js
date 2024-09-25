const logger = require("../utils/logger");

class ImageUploadController {
  async upload(req, res, next) {
    try {
      return res.status(200).json({ uploaded: true, location: req.body.file });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

module.exports = new ImageUploadController();
