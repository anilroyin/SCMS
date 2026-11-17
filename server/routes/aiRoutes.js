import express from "express";
import rateLimit from "express-rate-limit";

import protect from "../middleware/authMiddleware.js";

import { chatWithAI } from "../controllers/aiController.js";
import { publicChatWithAI } from "../controllers/publicAiController.js";

const router = express.Router();

// Limit public AI requests to reduce abuse and unexpected API costs.
const publicAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages. Please try again after some time."
  }
});

// Public AI endpoint. Login is not required.
router.post("/public-chat", publicAiLimiter, publicChatWithAI);

// Authenticated AI endpoints.
router.use(protect);

router.post("/chat", chatWithAI);

export default router;