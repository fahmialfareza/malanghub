const express = require("express");
const auth = require("../middlewares/auth");
const newsCommentsController = require("../controllers/newsCommentsController");

const router = express.Router();

// Reply Comment
router.post(
  "/commentReply/:id",
  auth.user,
  newsCommentsController.createCommentByComment
);

router
  .route("/:id")
  .get(newsCommentsController.getCommentsByNews)
  .post(auth.user, newsCommentsController.createComment);

module.exports = router;
