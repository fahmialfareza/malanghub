import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import "newrelic";
import path from "path";
import fs from "fs";
import express from "express";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import compression from "compression";

// Import error handler and logger
import errorHandler from "./middlewares/errorHandler";
import logger from "./utils/logger";

// Import routes
import usersRoute from "./routes/usersRoute";
import newsCategoriesRoute from "./routes/newsCategoriesRoute";
import newsTagsRoute from "./routes/newsTagsRoute";
import newsDraftsRoute from "./routes/newsDraftsRoute";
import newsRoute from "./routes/newsRoute";
import newsCommentsRoute from "./routes/newsCommentsRoute";
import imageUploadRoute from "./routes/imageUploadRoute";

const PORT = process.env.PORT || 4000;

const server = express();

// CORS
server.use(cors());

server.use(compression());

// Body Parser
server.use(express.json({ limit: "10mb" }));
server.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust the proxy
server.set("trust proxy", 10);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600,
});

server.use(limiter);

// Prevent HTTP param pollution
server.use(hpp());

// Logger based on environment
if (process.env.NODE_ENV === "development") {
  server.use(morgan("dev"));
} else if (process.env.VERCEL === "true") {
  server.use(morgan("common"));
} else {
  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    {
      flags: "a",
    }
  );
  server.use(morgan("combined", { stream: accessLogStream }));
}

// Use fileUpload
server.use(
  fileUpload({
    useTempFiles: true,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB file size limit
  })
);

// Serve static files
server.use(express.static("public"));

// Define Routes
server.use("/api/users", usersRoute);
server.use("/api/newsCategories", newsCategoriesRoute);
server.use("/api/newsTags", newsTagsRoute);
server.use("/api/newsDrafts", newsDraftsRoute);
server.use("/api/news", newsRoute);
server.use("/api/newsComments", newsCommentsRoute);
server.use("/api/upload", imageUploadRoute);

// Error handler middleware
server.use(errorHandler);

// Start server
server.listen(PORT, () => logger.error(`Server started on port ${PORT}`));
