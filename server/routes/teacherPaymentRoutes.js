import express from "express"
import {
  getTeacherPayments,
  getTeacherPaymentDetails,
  recordTeacherPayment
} from "../controllers/teacherPaymentController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getTeacherPayments
)

router.get(
  "/:teacherId",
  protect,
  allowRoles("admin"),
  getTeacherPaymentDetails
)

router.post(
  "/:teacherId/payment",
  protect,
  allowRoles("admin"),
  recordTeacherPayment
)

export default router