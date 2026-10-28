
import express from "express"
import {
  createExpense,
  getExpenses,
  getExpenseSummary,
  getTeacherContributions,
  getTeacherContributionHistory,
  getMyContributions,
  recordTeacherContribution,
  cancelExpense,
  recordTeacherRefund
} from "../controllers/expenseController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/my-contributions",
  protect,
  allowRoles("teacher"),
  getMyContributions
)

router.get(
  "/summary",
  protect,
  allowRoles("admin"),
  getExpenseSummary
)

router.get(
  "/contributions",
  protect,
  allowRoles("admin"),
  getTeacherContributions
)

router.get(
  "/contributions/:teacherId",
  protect,
  allowRoles("admin"),
  getTeacherContributionHistory
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createExpense
)

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getExpenses
)

// Record a teacher's payment across outstanding shared expenses, oldest first.
router.post(
  "/contributions/:teacherId/payment",
  protect,
  allowRoles("admin"),
  recordTeacherContribution
)

router.patch(
  "/:expenseId/cancel",
  protect,
  allowRoles("admin"),
  cancelExpense
)

router.post(
  "/:expenseId/contributions/:teacherId/refund",
  protect,
  allowRoles("admin"),
  recordTeacherRefund
)

export default router
