require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");

const { user } = require("../../models");
const logger = require("../../utils/logger");

exports.signup = async (req, res, next) => {
  passport.authenticate("signup", { session: false }, (err, user, info) => {
    if (err) {
      return next({ message: "Email sudah dipakai pengguna lain" });
    }

    if (err || !user) {
      return next({ message: info.message, statusCode: 401 });
    }

    req.user = user;

    next();
  })(req, res, next);
};

passport.use(
  "signup",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const newUser = await user.create(req.body);

        return done(null, newUser);
      } catch (e) {
        logger.error(e);
        return done(e.message, false, {
          message: "Email sudah dipakai pengguna lain",
        });
      }
    }
  )
);

exports.signin = async (req, res, next) => {
  passport.authenticate("signin", { session: false }, (err, user, info) => {
    if (err) {
      return next({ message: "Email sudah dipakai pengguna lain" });
    }

    if (!user) {
      return next({ message: info.message, statusCode: 401 });
    }

    req.user = user;

    next();
  })(req, res, next);
};

passport.use(
  "signin",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const userLogin = await user.findOne({ email });

        if (!userLogin) {
          return done(null, false, { message: "Pengguna tidak ditemukan" });
        }

        const validate = await bcrypt.compare(password, userLogin.password);

        if (!validate) {
          return done(null, false, { message: "Password Anda salah" });
        }

        return done(null, userLogin, {
          message: "Berhasil masuk",
        });
      } catch (e) {
        logger.error(e);
        return done(e.message, false, { message: "Gagal masuk" });
      }
    }
  )
);

exports.admin = async (req, res, next) => {
  passport.authorize("admin", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (err || !user) {
      return next({ message: info.message, statusCode: 403 });
    }

    req.user = user;

    next();
  })(req, res, next);
};

passport.use(
  "admin",
  new JWTStrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        const userLogin = await user.findOne({
          _id: token.user.id,
        });

        if (!userLogin) {
          return done(null, false, { message: "Anda tidak diizinkan" });
        }

        // if user.role includes transaksi it will next
        if (userLogin.role.includes("admin")) {
          return done(null, token.user);
        }

        // if user.role not includes transaksi it will not authorization
        return done(null, false, { message: "Anda tidak diizinkan" });
      } catch (e) {
        logger.error(e);
        return done(e.message, false, { message: "Anda tidak diizinkan" });
      }
    }
  )
);

exports.user = async (req, res, next) => {
  passport.authorize("user", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (err || !user) {
      return next({ message: info.message, statusCode: 403 });
    }

    req.user = user;

    next();
  })(req, res, next);
};

passport.use(
  "user",
  new JWTStrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        const userLogin = await user.findOne({
          _id: token.user.id,
        });

        if (!userLogin) {
          return done(null, false, { message: "Anda tidak diizinkan" });
        }

        // if user.role includes transaksi it will next
        if (userLogin.role.includes("user")) {
          return done(null, token.user);
        }

        // if user.role not includes transaksi it will not authorization
        return done(null, false, {
          message: "Anda tidak diizinkan",
        });
      } catch (e) {
        logger.error(e);
        return done(e.message, false, {
          message: "Anda tidak diizinkan",
        });
      }
    }
  )
);
