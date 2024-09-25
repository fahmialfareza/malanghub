import express from "express";
import * as auth from "@/middlewares/auth";
import * as newsValidator from "@/middlewares/validators/newsValidator";
import advancedResults from "@/middlewares/advancedResults";
import newsController from "@/controllers/newsController";
import { news } from "@/models";

const router = express.Router();

router.get("/", advancedResults(news), newsController.getAll);

router.get(
  "/myNews",
  auth.userAuth,
  advancedResults(news),
  newsController.myNews
);
router.get("/search", advancedResults(news), newsController.searchNews);

router
  .route("/:id")
  .put(auth.admin, newsValidator.update, newsController.update)
  .delete(auth.admin, newsValidator.deleteNews, newsController.delete);

router.get("/:slug", newsController.getOne);

export default router;
