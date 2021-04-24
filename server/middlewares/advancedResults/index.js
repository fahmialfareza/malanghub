const advancedResults = (model) => async (req, res, next) => {
  try {
    let query;

    // Copy req.query

    let reqQuery;

    if (req.baseUrl === "/api/newsDrafts") {
      if (req.route.path === "/") {
        reqQuery = { ...req.query, approved: false };
      } else if (req.route.path === "/myDrafts") {
        reqQuery = { ...req.query, approved: false, user: req.user.id };
      }
    } else if (req.baseUrl === "/api/news") {
      if (req.route.path === "/") {
        reqQuery = { ...req.query, approved: true };
      } else if (req.route.path === "/myNews") {
        reqQuery = { ...req.query, approved: true, user: req.user.id };
      } else if (req.route.path === "/search") {
        reqQuery = {
          ...req.query,
          approved: true,
          title: { $regex: ".*" + req.query.search + ".*", $options: "i" },
        };
      }
    }

    // Field to exclude
    const removeField = ["select", "sort", "page", "limit", "search"];

    // Loop over removeField and delete them from reqQuery
    removeField.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in|ne)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = model.find(JSON.parse(queryStr));

    // Select field
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort Fields
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments(query);

    query = query.skip(startIndex).limit(limit);

    query = query
      .populate({
        path: "user",
        select: "-password",
      })
      .populate("category")
      .populate("tags");

    // Executing query
    const results = await query;

    // Pagination result
    const pagination = {};
    pagination.currentPage = page;
    pagination.totalPages = Math.ceil(total / limit);

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.advancedResults = {
      count: results.length,
      pagination,
      data: results,
    };

    next();
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = advancedResults;
