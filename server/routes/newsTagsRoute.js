const express = require("express");
const auth = require("../middlewares/auth");
const newsTagsValidator = require("../middlewares/validators/newsTagsValidator");
const newsTagsController = require("../controllers/newsTagsController");

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

module.exports = router;
