import express from "express";
import * as auth from "@/middlewares/auth";
import * as newsCategoriesValidator from "@/middlewares/validators/newsCategoriesValidator";
import newsCategoriesController from "@/controllers/newsCategoriesController";

const router = express.Router();

router
  .route("/")
  .get(newsCategoriesController.getAll)
  .post(
    auth.admin,
    newsCategoriesValidator.create,
    newsCategoriesController.create
  );

router
  .route("/:id")
  .put(
    auth.admin,
    newsCategoriesValidator.update,
    newsCategoriesController.update
  )
  .delete(
    auth.admin,
    newsCategoriesValidator.deleteCategory,
    newsCategoriesController.delete
  );

router.get("/:slug", newsCategoriesController.getOne);

export default router; // export router
