import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  response?: {
    status: number;
    data: {
      message: string;
    };
  };
}

// Error-handling middleware
const errorHandler = async (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  // If the error has a response (from an API call or similar)
  if (err.response) {
    err.statusCode = err.response.status;
    err.message = err.response.data.message;
  }
  // Handle connection refusal errors
  else if (err.message.includes("ECONNREFUSED")) {
    err.message = "Internal Server Error";
  }

  // Return the response with the appropriate status code and message
  return res.status(err.statusCode || 500).json({
    message: err.message,
  });
};

export default errorHandler;
