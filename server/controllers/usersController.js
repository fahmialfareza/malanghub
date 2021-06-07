const jwt = require("jsonwebtoken");
const { user } = require("../models");
const { awsUserDelete } = require("../utils/amazons3");

class UsersController {
  async getProfile(req, res, next) {
    try {
      const data = await user
        .findById(req.user.id)
        .select("-password")
        .populate({
          path: "news",
          match: { approved: true },
          populate: [
            { path: "user", select: "-password" },
            { path: "tags" },
            { path: "category" },
          ],
        });

      if (!data) {
        return next({ message: "Pengguna tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }

  async updateProfile(req, res, next) {
    try {
      let data;

      if (req.body.photo) {
        data = await user.findById(req.user.id);

        if (data.photo && data.photo.includes("amazonaws.com")) {
          await awsUserDelete(data.photo);
        }
      }

      data = await user
        .findOneAndUpdate(
          { _id: req.user.id },
          { $set: req.body },
          { new: true }
        )
        .select("-password")
        .populate({
          path: "news",
          match: { approved: true },
          populate: [
            { path: "user", select: "-password" },
            { path: "tags" },
            { path: "category" },
          ],
        });

      return res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }

  async getUser(req, res, next) {
    try {
      const data = await user
        .findById(req.params.id)
        .select("-role -password")
        .populate({
          path: "news",
          match: { approved: true },
          populate: [
            { path: "user", select: "-password -role" },
            { path: "tags" },
            { path: "category" },
          ],
        });

      if (!data) {
        return next({ message: "Pengguna tidak ditemukan", statusCode: 404 });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return next(e);
    }
  }

  async signin(req, res, next) {
    try {
      const body = {
        user: {
          id: req.user.id,
        },
      };

      const token = await jwt.sign(body, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      return res.status(200).json({ token });
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = new UsersController();
