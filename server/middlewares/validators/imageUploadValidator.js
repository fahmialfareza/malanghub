const path = require("path");
const crypto = require("crypto");
const { uploader } = require("../../utils/cloudinary");

exports.upload = async (req, res, next) => {
  try {
    let errors = [];

    const file = req.files.file;

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

    // req.body.file = await aws_upload(file);
    const imageUpload = await uploader(file);
    req.body.file = imageUpload.secure_url;

    next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
};
