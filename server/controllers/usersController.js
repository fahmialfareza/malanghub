const jwt = require("jsonwebtoken");
const { user } = require("../models");
const { awsUserDelete } = require("../utils/amazons3");

class UsersController {
  async getProfile(req, res) {
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
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async updateProfile(req, res) {
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
      return res.status(500).json({ message: e.message });
    }
  }

  async getUser(req, res) {
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
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async signin(req, res) {
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
      return res.status(500).json({ message: e.message });
    }
  }

  async signout(req, res) {
    try {
      res.status(200).json({ message: "Sign Out Success" });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
}

module.exports = new UsersController();
