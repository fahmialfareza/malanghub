const express = require("express");

const imageUploadValidator = require("../middlewares/validators/imageUploadValidator");
const imageUploadController = require("../controllers/imageUploadController");

const router = express.Router();

router.post("/", imageUploadValidator.upload, imageUploadController.upload);

module.exports = router;
