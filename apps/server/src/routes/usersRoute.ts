import express from "express";
import * as auth from "../middlewares/auth";
import * as usersValidator from "../middlewares/validators/usersValidator";
import usersController from "../controllers/usersController";

const router = express.Router();

router
  .route("/")
  .get(auth.userAuth, usersController.getProfile)
  .put(
    auth.userAuth,
    usersValidator.updateProfile,
    usersController.updateProfile
  );

// User sign up
router.post(
  "/signup",
  usersValidator.signup,
  auth.signup,
  usersController.signin
);

// User sign in
router.post(
  "/signin",
  usersValidator.signin,
  auth.signin,
  usersController.signin
);

// Google sign in
router.post("/google", usersValidator.google, usersController.google);

// Get User Profile
router.get("/:id", usersValidator.getUser, usersController.getUser);

export default router;
