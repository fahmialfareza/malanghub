const express = require("express");
const auth = require("../middlewares/auth");
const usersValidator = require("../middlewares/validators/usersValidator");
const usersController = require("../controllers/usersController");

const router = express.Router();

router
  .route("/")
  .get(auth.user, usersController.getProfile)
  .put(auth.user, usersValidator.updateProfile, usersController.updateProfile);

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

// Get User Profile
router.get("/:id", usersValidator.getUser, usersController.getUser);

module.exports = router;
