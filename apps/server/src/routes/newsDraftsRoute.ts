import express from "express";
import * as auth from "@/middlewares/auth";
import * as newsDraftsValidator from "@/middlewares/validators/newsDraftsValidator";
import advancedResults from "@/middlewares/advancedResults";
import newsDraftsController from "@/controllers/newsDraftsController";
import { news } from "@/models";

const router = express.Router();

router
  .route("/")
  .get(advancedResults(news), newsDraftsController.getAll)
  .post(auth.userAuth, newsDraftsValidator.create, newsDraftsController.create);

// Get My News Draft (User)
router.get(
  "/myDrafts",
  auth.userAuth,
  advancedResults(news),
  newsDraftsController.myDrafts
);

router
  .route("/:id")
  .put(auth.userAuth, newsDraftsValidator.update, newsDraftsController.update)
  .delete(
    auth.userAuth,
    newsDraftsValidator.deleteNewsDraft,
    newsDraftsController.delete
  );

router.get("/:slug", newsDraftsController.getOne);

export default router;
