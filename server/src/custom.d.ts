import { ObjectId } from "mongoose";

declare global {
  namespace Express {
    interface Response {
      advancedResults?: {
        count: number;
        pagination: {
          currentPage: number;
          totalPages: number;
          next?: {
            page: number;
            limit: number;
          };
          prev?: {
            page: number;
            limit: number;
          };
        };
        data: any[];
      };
    }

    interface User {
      id: ObjectId;
      email: string;
      role: string;
    }

    interface Request {
      user?: User;
    }
  }
}
