require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const bcrypt = require("bcryptjs");
const jose = require("jose");

const { user } = require("../../models");

exports.signup = async (req, res, next) => {
  try {
    const newUser = await user.create(req.body);
    req.user = newUser;
    next();
  } catch (e) {
    console.log(e);
    next({ message: "Email sudah dipakai pengguna lain", statusCode: 400 });
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userLogin = await user.findOne({ email });

    if (!userLogin) {
      return next({ message: "Pengguna tidak ditemukan", statusCode: 401 });
    }

    const validate = await bcrypt.compare(password, userLogin.password);

    if (!validate) {
      return next({ message: "Password Anda salah", statusCode: 401 });
    }

    req.user = userLogin;
    next();
  } catch (e) {
    console.log(e);
    next({ message: "Gagal masuk", statusCode: 500 });
  }
};

const authorize = (role) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next({ message: "Anda tidak diizinkan", statusCode: 403 });
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = authHeader.split(" ")[1];

      const { payload } = await jose.jwtVerify(token, secret);

      const userLogin = await user.findOne({ _id: payload.user.id });
      if (!userLogin || !userLogin.role.includes(role)) {
        return next({ message: "Anda tidak diizinkan", statusCode: 403 });
      }

      req.user = payload.user;
      next();
    } catch (e) {
      console.log(e);
      next({ message: "Anda tidak diizinkan", statusCode: 403 });
    }
  };
};

exports.admin = authorize("admin");
exports.user = authorize("user");
