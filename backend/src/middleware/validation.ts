import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// Phone number validation
export const validatePhoneNumber = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError(400, "Phone number is required");
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.toString().replace(/\D/g, "");

  // Validate phone number format (10-15 digits)
  if (!/^\d{10,15}$/.test(cleaned)) {
    throw new ApiError(400, "Invalid phone number format. Must be 10-15 digits");
  }

  // Attach cleaned phone number to request
  req.body.phoneNumber = cleaned;
  next();
};

// Pairing code request validation
export const validatePairingCodeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phoneNumber, isUpdate, oldNumber } = req.body;

  // Validate phone number
  if (!phoneNumber) {
    throw new ApiError(400, "Phone number is required");
  }

  // If it's an update, oldNumber is required
  if (isUpdate && !oldNumber) {
    throw new ApiError(400, "Old number is required for updates");
  }

  next();
};
