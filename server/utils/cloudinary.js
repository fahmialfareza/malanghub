const cloudinary = require("cloudinary");

/* Cloudinary config */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Cloudinary Uploader */
exports.uploader = (file) => {
  return new Promise(function (resolve, reject) {
    cloudinary.uploader.upload(file.tempFilePath, function (result, err) {
      if (err) {
        console.error(err);
      }

      resolve(result);
    });
  });
};
