const express = require("express");
const auth = require("../middlewares/auth");
const newsCategoriesValidator = require("../middlewares/validators/newsCategoriesValidator");
const newsCategoriesController = require("../controllers/newsCategoriesController");

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

module.exports = router; // export router
