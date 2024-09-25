const express = require("express");
const auth = require("../middlewares/auth");
const newsValidator = require("../middlewares/validators/newsValidator");
const advancedResults = require("../middlewares/advancedResults");
const newsController = require("../controllers/newsController");
const { news } = require("../models");

const router = express.Router();

router.get("/", advancedResults(news), newsController.getAll);

router.get("/myNews", auth.user, advancedResults(news), newsController.myNews);
router.get("/search", advancedResults(news), newsController.searchNews);

router
  .route("/:id")
  .put(auth.admin, newsValidator.update, newsController.update)
  .delete(auth.admin, newsValidator.deleteNews, newsController.delete);

router.get("/:slug", newsController.getOne);

module.exports = router;
