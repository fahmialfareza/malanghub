import * as cloudinary from "cloudinary";
import logger from "./logger";

/* Cloudinary config */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

/* Cloudinary Uploader */
export const uploader = (file: {
  tempFilePath: string;
}): Promise<cloudinary.UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(file.tempFilePath, (err, result) => {
      if (err) {
        logger.error(err);
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};
