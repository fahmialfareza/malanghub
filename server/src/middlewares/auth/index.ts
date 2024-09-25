import dotenv from "dotenv";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as JWTStrategy,
  ExtractJwt as ExtractJWT,
} from "passport-jwt";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { user } from "@/models";
import logger from "@/utils/logger";
import { CustomError } from "@/middlewares/errorHandler";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Signup
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate(
    "signup",
    { session: false },
    (
      err: CustomError,
      user: Express.User | undefined,
      info: { message: any }
    ) => {
      if (err) {
        return next({ message: err.message });
      }

      if (err || !user) {
        return next({ message: info.message, statusCode: 401 });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// Passport signup strategy
passport.use(
  "signup",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req: Request, email: string, password: string, done) => {
      try {
        // Create new user
        const newUser = await user.create(req.body);

        // Convert the _id to id and return the new user
        const plainUserObject = {
          ...newUser.toObject(), // Convert Mongoose document to plain object
          id: newUser._id, // Add id field
        };

        return done(null, plainUserObject);
      } catch (e) {
        if (e instanceof Error) {
          logger.error(e);
          return done(e.message, false, {
            message: e.message,
          });
        }
        return done("Unknown error", false);
      }
    }
  )
);

// Signin
export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authenticate(
    "signin",
    { session: false },
    (
      err: CustomError,
      user: Express.User | undefined,
      info: { message: any }
    ) => {
      if (err) {
        return next({ message: err.message });
      }

      if (!user) {
        return next({ message: info.message, statusCode: 401 });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// signin strategy
passport.use(
  "signin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const userLogin = await user.findOne({ email }).lean();

        if (!userLogin) {
          return done(null, false, { message: "Pengguna tidak ditemukan" });
        }

        // Ensure password is a valid string
        if (!userLogin.password || typeof userLogin.password !== "string") {
          return done(null, false, { message: "Password not found" });
        }

        const validate = await bcrypt.compare(password, userLogin.password);

        if (!validate) {
          return done(null, false, { message: "Password Anda salah" });
        }

        // Map _id to id
        return done(
          null,
          { ...userLogin, id: userLogin._id }, // Ensure _id is converted to string
          { message: "Berhasil masuk" }
        );
      } catch (e) {
        if (e instanceof Error) {
          logger.error(e);
          return done(e.message, false, { message: "Gagal masuk" });
        }
        return done("Unknown error", false);
      }
    }
  )
);

// Admin authorization
export const admin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authorize(
    "admin",
    (
      err: CustomError,
      user: Express.User | undefined,
      info: { message: any }
    ) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next({ message: info.message, statusCode: 403 });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// Passport admin strategy
passport.use(
  "admin",
  new JWTStrategy(
    {
      secretOrKey: process.env.JWT_SECRET as string,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token: { user: { id: string } }, done) => {
      try {
        const userLogin = await user.findOne({ _id: token.user.id });

        if (!userLogin || !userLogin.role.includes("admin")) {
          return done(null, false, { message: "Anda tidak diizinkan" });
        }

        return done(null, token.user);
      } catch (e) {
        if (e instanceof Error) {
          logger.error(e);
          return done(e.message, false, { message: "Anda tidak diizinkan" });
        }
        return done("Unknown error", false);
      }
    }
  )
);

// User authorization
export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  passport.authorize(
    "user",
    (
      err: CustomError,
      user: Express.User | undefined,
      info: { message: any }
    ) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next({ message: info.message, statusCode: 403 });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

// Passport user strategy
passport.use(
  "user",
  new JWTStrategy(
    {
      secretOrKey: process.env.JWT_SECRET as string,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token: { user: { id: string } }, done) => {
      try {
        const userLogin = await user.findOne({ _id: token.user.id });

        if (!userLogin || !userLogin.role.includes("user")) {
          return done(null, false, { message: "Anda tidak diizinkan" });
        }

        return done(null, token.user);
      } catch (e) {
        if (e instanceof Error) {
          logger.error(e);
          return done(e.message, false, { message: "Anda tidak diizinkan" });
        }
        return done("Unknown error", false);
      }
    }
  )
);
