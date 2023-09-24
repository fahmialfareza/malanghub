const jwt = require("jsonwebtoken");
const { user, redisClient } = require("../models");

const oneDay = 60 * 60 * 24;

class UsersController {
  async getProfile(req, res, next) {
    try {
      const key = `user:profile:${req.user.id}`;
      const redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
        await redis.disconnect();
        data = JSON.parse(data);
        return res.status(200).json({ data });
      }

      data = await user
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

      await redis.set(key, JSON.stringify(data), { EX: oneDay });
      await redis.disconnect();

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const key = `user:profile:${req.user.id}`;
      const redis = await redisClient();
      let data;

      if (req.body.photo) {
        data = await user.findById(req.user.id);
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

      await redis.set(key, JSON.stringify(data), { EX: oneDay });
      await redis.disconnect();

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    }
  }

  async getUser(req, res, next) {
    try {
      const key = `user:profile:${req.params.id}`;
      const redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
        await redis.disconnect();
        data = JSON.parse(data);
        return res.status(200).json({ data });
      }

      data = await user
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

      await redis.set(key, JSON.stringify(data), { EX: oneDay });
      await redis.disconnect();

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
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
      console.error(e);
      return next(e);
    }
  }
}

module.exports = new UsersController();
