import { Router } from "express";
import { pairingRoute } from "../controllers/whatsApp.controllers";
import { pairingCodeRateLimit } from "../middleware/rateLimiter";
import { validatePairingCodeRequest, validatePhoneNumber } from "../middleware/validation";

const router = Router();

// Apply rate limiting and validation to pairing code endpoint
router
  .route("/pairing-code")
  .post(
    pairingCodeRateLimit,
    validatePairingCodeRequest,
    validatePhoneNumber,
    pairingRoute
  );

export default router;
