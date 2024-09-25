import express from "express";
import * as auth from "@/middlewares/auth";
import newsCommentsController from "@/controllers/newsCommentsController";

const router = express.Router();

// Reply Comment
router.post(
  "/commentReply/:id",
  auth.userAuth,
  newsCommentsController.createCommentByComment
);

router
  .route("/:id")
  .get(newsCommentsController.getCommentsByNews)
  .post(auth.userAuth, newsCommentsController.createComment);

export default router;
