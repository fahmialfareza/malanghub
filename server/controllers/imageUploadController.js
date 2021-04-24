class ImageUploadController {
  async upload(req, res) {
    try {
      return res.status(200).json({ uploaded: true, location: req.body.file });
    } catch (e) {
      return res.status(500).json({ uploaded: false, message: e.message });
    }
  }
}

module.exports = new ImageUploadController();
