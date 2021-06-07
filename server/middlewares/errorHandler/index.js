module.exports = async (err, req, res, next) => {
  if (err.response) {
    err.statusCode = err.response.status;
    err.message = err.response.data.message;
  } else if (err.message.includes("ECONNREFUSED")) {
    err.message = "Internal Server Error";
  }

  return res.status(err.statusCode || 500).json({
    message: err.message,
  });
};
