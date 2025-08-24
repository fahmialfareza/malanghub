import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { user } from "@/models";
import logger from "@/utils/logger";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const JWT_SECRET = process.env.JWT_SECRET as string;

const getTokenFromHeader = (req: Request): string | null => {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme ?? "")) return null;
  return token ?? null;
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newUser = await user.create(req.body);

    const plainUserObject = {
      ...newUser.toObject(),
      id: newUser._id,
    };

    (req as any).user = plainUserObject;
    next();
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      return next({ message: e.message, statusCode: 400 });
    }
    return next({ message: "Unknown error", statusCode: 500 });
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const userLogin = await user.findOne({ email }).lean();

    if (!userLogin) {
      return next({ message: "Pengguna tidak ditemukan", statusCode: 401 });
    }

    if (!userLogin.password || typeof userLogin.password !== "string") {
      return next({ message: "Password not found", statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, userLogin.password);
    if (!valid) {
      return next({ message: "Password Anda salah", statusCode: 401 });
    }

    const payload = { user: { id: userLogin._id.toString() } };
    const token = jwt.sign(payload, JWT_SECRET);

    const userWithId = { ...userLogin, id: userLogin._id };

    (req as any).user = userWithId;
    (req as any).token = token;
    res.locals.token = token;

    next();
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      return next({ message: "Gagal masuk", statusCode: 500 });
    }
    return next({ message: "Unknown error", statusCode: 500 });
  }
};

export const admin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return next({ message: "Token not provided", statusCode: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return next({ message: "Token invalid", statusCode: 401 });
    }

    const userId = decoded?.user?.id;
    if (!userId) {
      return next({ message: "Token payload invalid", statusCode: 401 });
    }

    const userLogin = await user.findOne({ _id: userId });
    if (!userLogin || !userLogin.role?.includes("admin")) {
      return next({ message: "Anda tidak diizinkan", statusCode: 403 });
    }

    (req as any).user = { id: userLogin._id, ...userLogin.toObject() };
    next();
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      return next({ message: "Anda tidak diizinkan", statusCode: 403 });
    }
    return next({ message: "Unknown error", statusCode: 500 });
  }
};

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return next({ message: "Token not provided", statusCode: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return next({ message: "Token invalid", statusCode: 401 });
    }

    const userId = decoded?.user?.id;
    if (!userId) {
      return next({ message: "Token payload invalid", statusCode: 401 });
    }

    const userLogin = await user.findOne({ _id: userId });
    if (!userLogin || !userLogin.role?.includes("user")) {
      return next({ message: "Anda tidak diizinkan", statusCode: 403 });
    }

    (req as any).user = { id: userLogin._id, ...userLogin.toObject() };
    next();
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      return next({ message: "Anda tidak diizinkan", statusCode: 403 });
    }
    return next({ message: "Unknown error", statusCode: 500 });
  }
};
