require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const { inject } = require("@vercel/analytics");

inject();

const PORT = process.env.PORT || 4000;
// Import error handler
const errorHandler = require("./middlewares/errorHandler");

// Import routes
const usersRoute = require("./routes/usersRoute");
const newsCategoriesRoute = require("./routes/newsCategoriesRoute");
const newsTagsRoute = require("./routes/newsTagsRoute");
const newsDraftsRoute = require("./routes/newsDraftsRoute");
const newsRoute = require("./routes/newsRoute");
const newsCommentsRoute = require("./routes/newsCommentsRoute");
const imageUploadRoute = require("./routes/imageUploadRoute");

const server = express();

// CORS
server.use(cors());

// Body Parser
server.use(express.json());
server.use(
  express.urlencoded({
    extended: true,
  })
);

// Sanitize data
server.use(mongoSanitize());

// Prevent XSS attact
server.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 600,
});

server.use(limiter);

// Prevent http param pollution
server.use(hpp());

if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
} else if (process.env.VERCEL === "true") {
  server.use(morgan("common"));
} else {
  // create a write stream (in serverend mode)
  let accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    {
      flags: "a",
    }
  );

  // setup the logger
  server.use(morgan("combined", { stream: accessLogStream }));
}

// Use fileUpload
server.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Use static files
server.use(express.static("public"));

// Routes
server.use("/api/users", usersRoute);
server.use("/api/newsCategories", newsCategoriesRoute);
server.use("/api/newsTags", newsTagsRoute);
server.use("/api/newsDrafts", newsDraftsRoute);
server.use("/api/news", newsRoute);
server.use("/api/newsComments", newsCommentsRoute);
server.use("/api/upload", imageUploadRoute);

server.use(errorHandler);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
