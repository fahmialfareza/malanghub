const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

// Create S3 service object
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  },
  region: "ap-southeast-1",
});

/* AWS S3 */
// Set the parameters
const uploadParams = {
  Bucket: process.env.AWS_S3_BUCKET,
}; //BUCKET_NAME, KEY (the name of the selected file)

// call S3 to retrieve upload file to specified bucket
exports.awsUserUpload = async (file) => {
  uploadParams.Body = file.data;
  uploadParams.Key = `user/${file.name}`;
  uploadParams.ACL = "public-read";
  uploadParams.ContentType = file.mimetype;
  // call S3 to retrieve upload file to specified bucket
  try {
    // Upload to S3
    const uploadData = await s3.send(new PutObjectCommand(uploadParams));

    return process.env.AWS_S3_FILE_URL + `user/${file.name}`;
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.awsNewsUpload = async (file) => {
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
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.awsUserDelete = async (photo) => {
  const deleteUserParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${photo.slice(54)}`,
  };

  await s3.send(new DeleteObjectCommand(deleteUserParams));
};

exports.awsNewsDelete = async (mainImage) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${mainImage.slice(54)}`,
  };

  await s3.send(new DeleteObjectCommand(params));
};

/* End AWS S3 */
