import * as cloudinary from "cloudinary";
import logger from "./logger";
import fs from "fs";

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
      // Attempt to clean temp file whether upload succeeded or failed
      const cleanup = () => {
        try {
          fs.unlink(file.tempFilePath, (unlinkErr) => {
            if (unlinkErr)
              logger.error("Failed to remove temp file", unlinkErr);
          });
        } catch (e) {
          logger.error("Cleanup error", e);
        }
      };

      if (err) {
        logger.error(err);
        cleanup();
        reject(err);
        return;
      }

      cleanup();
      resolve(result);
    });
  });
};
