import express from "express";
import * as auth from "@/middlewares/auth";
import * as newsTagsValidator from "@/middlewares/validators/newsTagsValidator";
import newsTagsController from "@/controllers/newsTagsController";

const router = express.Router();

router
  .route("/")
  .get(newsTagsController.getAll)
  .post(auth.admin, newsTagsValidator.create, newsTagsController.create);

router
  .route("/:id")
  .put(auth.admin, newsTagsValidator.update, newsTagsController.update)
  .delete(auth.admin, newsTagsValidator.deleteTag, newsTagsController.delete);

router.get("/:slug", newsTagsController.getOne);

export default router;
