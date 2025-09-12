import { Request, Response, NextFunction } from "express";
import { Model } from "mongoose";
import logger from "@/utils/logger";

// Utility function for advanced query results
const advancedResults =
  (model: Model<any>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let query;
      let reqQuery: Record<string, any> = {};

      // Adjusting reqQuery based on different routes
      if (req.baseUrl === "/api/newsDrafts") {
        if (req.route.path === "/") {
          reqQuery = { ...req.query, approved: false };
        } else if (req.route.path === "/myDrafts") {
          reqQuery = { ...req.query, approved: false, user: req.user?.id };
        }
      } else if (req.baseUrl === "/api/news") {
        if (req.route.path === "/") {
          reqQuery = { ...req.query, approved: true };
        } else if (req.route.path === "/myNews") {
          reqQuery = { ...req.query, approved: true, user: req.user?.id };
        } else if (req.route.path === "/search") {
          reqQuery = {
            ...req.query,
            approved: true,
            $or: [
              {
                title: {
                  $regex: ".*" + req.query.search + ".*",
                  $options: "i",
                },
              },
              {
                content: {
                  $regex: ".*" + req.query.search + ".*",
                  $options: "i",
                },
              },
            ],
          };
        }
      }

      // Fields to exclude
      const removeFields = ["select", "sort", "page", "limit", "search"];

      // Remove unwanted fields from reqQuery
      removeFields.forEach((param) => delete reqQuery[param]);

      // Create query string with operators ($gt, $gte, etc)
      let queryStr = JSON.stringify(reqQuery);
      queryStr = queryStr.replace(
        /\b(gt|gte|lt|lte|in|ne)\b/g,
        (match) => `$${match}`
      );

      // Finding resource
      query = model.find(JSON.parse(queryStr));

      // Select fields
      if (req.query.select) {
        const fields = (req.query.select as string).split(",").join(" ");
        query = query.select(fields);
      }

      // Sort fields
      if (req.query.sort) {
        const sortBy = (req.query.sort as string).split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }

      // Pagination setup
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const total = await model.countDocuments(query);

      query = query.skip(startIndex).limit(limit);

      // Populate related fields
      query = query
        .populate({
          path: "user",
          select: "-password",
        })
        .populate("category")
        .populate("tags");

      // Execute the query
      const results = await query;

      // Setup pagination results
      const pagination: {
        currentPage: number;
        totalPages: number;
        next?: { page: number; limit: number };
        prev?: { page: number; limit: number };
      } = {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };

      if (endIndex < total) {
        pagination.next = { page: page + 1, limit };
      }

      if (startIndex > 0) {
        pagination.prev = { page: page - 1, limit };
      }

      // Add results to the response object
      res.advancedResults = {
        count: results.length,
        pagination,
        data: results,
      };

      next();
    } catch (e) {
      logger.error(e);
      next(e);
    }
  };

export default advancedResults;
