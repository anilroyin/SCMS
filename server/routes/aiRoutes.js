
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { chatWithAI } from "../controllers/aiController.js";

const router = express.Router();

// All AI endpoints require authentication.
router.use(protect);

// Admin, Teacher, and Student can use the AI assistant.
router.post("/chat", chatWithAI);

export default router;
