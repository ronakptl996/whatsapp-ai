import { Request, Response, NextFunction } from "express";
import { supabase } from "../utils/Supabase";
import { ApiError } from "../utils/ApiError";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token;

    // Get token from Authorization header or cookie
    let accessToken: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    } else if (token) {
      accessToken = token;
    }

    if (!accessToken) {
      throw new ApiError(401, "Authentication token required");
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      throw new ApiError(401, "Invalid or expired token");
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      });
      return;
    }

    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};
