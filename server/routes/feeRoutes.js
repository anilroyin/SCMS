import express from "express"
import {
  generateFees,
  getFees,
  getFeeSummary,
  getStudentFees,
  getMyStudentFees,
  recordPayment
} from "../controllers/feeController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get("/", protect, allowRoles("admin"), getFees)

router.get(
  "/summary",
  protect,
  allowRoles("admin"),
  getFeeSummary
)

router.get(
  "/student/me",
  protect,
  allowRoles("student"),
  getMyStudentFees
)

router.get(
  "/student/:studentId",
  protect,
  allowRoles("admin"),
  getStudentFees
)

router.post(
  "/generate",
  protect,
  allowRoles("admin"),
  generateFees
)

router.post(
  "/student/:studentId/payment",
  protect,
  allowRoles("admin"),
  recordPayment
)

export default router