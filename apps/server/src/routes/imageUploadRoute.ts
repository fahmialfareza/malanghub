import express from "express";
import * as imageUploadValidator from "@/middlewares/validators/imageUploadValidator";
import imageUploadController from "@/controllers/imageUploadController";

const router = express.Router();

router.post("/", imageUploadValidator.upload, imageUploadController.upload);

export default router;
