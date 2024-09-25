import jwt from "jsonwebtoken";
import axios from "axios";
import { user, redisClient } from "@/models";
import logger from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
import { RedisClientType } from "redis";

const oneDay = 60 * 60 * 24;

class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    let redis: RedisClientType | undefined;

    try {
      const key = `user:profile:${req.user?.id}`;
      redis = await redisClient();

      // Try to get data from Redis
      const redisData = await redis.get(key);
      if (redisData) {
        const data = JSON.parse(redisData); // Redis data is always a string
        return res.status(200).json({ data });
      }

      // Get data from MongoDB
      const dbData = await user
        .findById(req.user?.id)
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

      if (!dbData) {
        return next({ message: "Pengguna tidak ditemukan", statusCode: 404 });
      }

      // Cache the data in Redis if it's under 1MB
      const dataByteSize = Buffer.from(JSON.stringify(dbData)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(dbData), { EX: oneDay });
      }

      // Send the response
      return res.status(200).json({ data: dbData });
    } catch (e) {
      logger.error(e);
      return next(e);
    } finally {
      // Ensure redis is defined before disconnecting
      if (redis) {
        await redis.disconnect();
      }
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    let redis: RedisClientType | undefined;

    try {
      const key = `user:profile:${req.user?.id}`;
      redis = await redisClient();
      let data;

      if (req.body.photo) {
        data = await user.findById(req.user?.id);
      }

      data = await user
        .findOneAndUpdate(
          { _id: req.user?.id },
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
      logger.error(e);
      return next(e);
    } finally {
      // Ensure redis is defined before disconnecting
      if (redis) {
        await redis.disconnect();
      }
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    let redis: RedisClientType | undefined;

    try {
      const key = `user:profile:${req.params.id}`;
      redis = await redisClient();

      let data = await redis.get(key);
      if (data) {
        data = JSON.parse(data);
        return res.status(200).json({ data });
      }

      const dbData = await user
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

      if (!dbData) {
        return next({ message: "Pengguna tidak ditemukan", statusCode: 404 });
      }

      const dataByteSize = Buffer.from(JSON.stringify(data)).length;
      if (dataByteSize < 1048576) {
        await redis.set(key, JSON.stringify(data), { EX: oneDay });
      }

      return res.status(200).json({ data });
    } catch (e) {
      logger.error(e);
      return next(e);
    } finally {
      // Ensure redis is defined before disconnecting
      if (redis) {
        await redis.disconnect();
      }
    }
  }

  async signin(req: Request, res: Response, next: NextFunction) {
    try {
      const body = {
        user: {
          id: req.user?.id,
        },
      };

      const token = await jwt.sign(body, process.env.JWT_SECRET!, {
        expiresIn: "30d",
      });

      return res.status(200).json({ token });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }

  async google(req: Request, res: Response, next: NextFunction) {
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

      const token = await jwt.sign(body, process.env.JWT_SECRET!, {
        expiresIn: "30d",
      });

      return res.status(200).json({ token });
    } catch (e) {
      logger.error(e);
      return next(e);
    }
  }
}

export default new UsersController();
