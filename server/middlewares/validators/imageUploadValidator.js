const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

/* AWS S3 */
// Set the parameters
const uploadParams = {
  Bucket: process.env.AWS_S3_BUCKET,
}; //BUCKET_NAME, KEY (the name of the selected file)

// Create S3 service object
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  },
  region: "ap-southeast-1",
});

// call S3 to retrieve upload file to specified bucket
const aws_upload = async (file) => {
  uploadParams.Body = file.data;
  uploadParams.Key = `news/${file.name}`;
  uploadParams.ACL = "public-read";
  uploadParams.ContentType = file.mimetype;
  // call S3 to retrieve upload file to specified bucket
  try {
    // Upload to S3
    const uploadData = await s3.send(new PutObjectCommand(uploadParams));

    return process.env.AWS_S3_FILE_URL + `news/${file.name}`;
  } catch (err) {
    throw new Error(err);
  }
};

/* End AWS S3 */

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

    req.body.file = await aws_upload(file);

    next();
  } catch (e) {
    return next(e);
  }
};
