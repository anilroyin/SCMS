
import express from "express";

import {
  getFeeReport,
  getTeacherPaymentReport,
  getStudentReport,
  getFinancialSummary
} from "../controllers/reportController.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Protect all report endpoints: Admin only
router.use(protect, allowRoles("admin"));

router.get("/fees", getFeeReport);

router.get("/teacher-payments", getTeacherPaymentReport);

router.get("/students", getStudentReport);

router.get("/summary", getFinancialSummary);

export default router;
