import express from "express"
import {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAdminNotificationAsRead,
  getNotificationLogs
} from "../controllers/notificationController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.post(
  "/",
  protect,
  allowRoles("admin", "teacher"),
  createNotification
)

router.get(
  "/me",
  protect,
  allowRoles("admin", "teacher", "student"),
  getMyNotifications
)

router.put(
  "/:id/read",
  protect,
  allowRoles("admin", "teacher", "student"),
  markNotificationAsRead
)

router.put(
  "/:id/admin-read",
  protect,
  allowRoles("admin"),
  markAdminNotificationAsRead
)

router.get(
  "/logs",
  protect,
  allowRoles("admin"),
  getNotificationLogs
)

export default router