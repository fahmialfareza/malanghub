const jwt = require("jsonwebtoken");
const axios = require("axios");
const { user, redisClient } = require("../models");

const oneDay = 60 * 60 * 24;

class UsersController {
  async getProfile(req, res, next) {
    let redis;

    try {
      const key = `user:profile:${req.user.id}`;
      redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
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

      const dataByteSize = Buffer.from(JSON.stringify(data)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(data), { EX: oneDay });
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    } finally {
      await redis.disconnect();
    }
  }

  async updateProfile(req, res, next) {
    let redis;

    try {
      const key = `user:profile:${req.user.id}`;
      redis = await redisClient();
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

      const dataByteSize = Buffer.from(JSON.stringify(data)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(data), { EX: oneDay });
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    } finally {
      await redis.disconnect();
    }
  }

  async getUser(req, res, next) {
    let redis;

    try {
      const key = `user:profile:${req.params.id}`;
      redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
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

      const dataByteSize = Buffer.from(JSON.stringify(data)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(data), { EX: oneDay });
      }

      return res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      return next(e);
    } finally {
      await redis.disconnect();
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

  async google(req, res, next) {
    try {
      const { access_token } = req.body;

      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
      );
      const { email, name, picture } = response.data;

      let googleUser = await user.findOne({ email });
      if (!googleUser) {
        googleUser = await user.create({
          email,
          name,
          role: "user",
          photo: picture,
        });
      }

      const body = {
        user: {
          id: googleUser.id,
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
