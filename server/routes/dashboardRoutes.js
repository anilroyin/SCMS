
import express from "express"
import {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard
} from "../controllers/dashboardController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/admin",
  protect,
  allowRoles("admin"),
  getAdminDashboard
)

router.get(
  "/teacher",
  protect,
  allowRoles("teacher"),
  getTeacherDashboard
)

router.get(
  "/student",
  protect,
  allowRoles("student"),
  getStudentDashboard
)

export default router
