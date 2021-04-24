const express = require("express");
const auth = require("../middlewares/auth");
const newsDraftsValidator = require("../middlewares/validators/newsDraftsValidator");
const advancedResults = require("../middlewares/advancedResults");
const newsDraftsController = require("../controllers/newsDraftsController");
const { news } = require("../models");

const router = express.Router();

router
  .route("/")
  .get(advancedResults(news), newsDraftsController.getAll)
  .post(auth.user, newsDraftsValidator.create, newsDraftsController.create);

// Get My News Draft (User)
router.get(
  "/myDrafts",
  auth.user,
  advancedResults(news),
  newsDraftsController.myDrafts
);

router
  .route("/:id")
  .put(auth.user, newsDraftsValidator.update, newsDraftsController.update)
  .delete(
    auth.user,
    newsDraftsValidator.deleteNewsDraft,
    newsDraftsController.delete
  );

router.get("/:slug", newsDraftsController.getOne);

module.exports = router;
