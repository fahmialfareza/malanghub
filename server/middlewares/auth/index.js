require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");

const { user } = require("../../models");

exports.signup = async (req, res, next) => {
  passport.authenticate("signup", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        message: "Email has been used",
      });
    }

    if (err || !user) {
      return res.status(401).json({ message: info.message });
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
        return done(e.message, false, {
          message: "Email has been used",
        });
      }
    }
  )
);

exports.signin = async (req, res, next) => {
  passport.authenticate("signin", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: err });
    }

    if (!user) {
      return res.status(401).json({ message: info.message });
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
          return done(null, false, { message: "User not found" });
        }

        const validate = await bcrypt.compare(password, userLogin.password);

        if (!validate) {
          return done(null, false, { message: "Wrong password" });
        }

        return done(null, userLogin, {
          message: "Signin success",
        });
      } catch (e) {
        return done(e.message, false, { message: "Signin failed" });
      }
    }
  )
);

exports.admin = async (req, res, next) => {
  passport.authorize("admin", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: err });
    }

    if (!user) {
      return res.status(403).json({ message: info.message });
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
          return done(null, false, { message: "You're not authorized" });
        }

        // if user.role includes transaksi it will next
        if (userLogin.role.includes("admin")) {
          return done(null, token.user);
        }

        // if user.role not includes transaksi it will not authorization
        return done(null, false, { message: "You're not authorized" });
      } catch (e) {
        return done(e.message, false, { message: "You're not authorized" });
      }
    }
  )
);

exports.user = async (req, res, next) => {
  passport.authorize("user", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: err });
    }

    if (!user) {
      return res.status(403).json({ message: info.message });
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
          return done(null, false, { message: "You're not authorized" });
        }

        // if user.role includes transaksi it will next
        if (userLogin.role.includes("user")) {
          return done(null, token.user);
        }

        // if user.role not includes transaksi it will not authorization
        return done(null, false, {
          message: "You're not authorized",
        });
      } catch (e) {
        return done(e.message, false, {
          message: "You're not authorized",
        });
      }
    }
  )
);
