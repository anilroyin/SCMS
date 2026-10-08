import express from "express"
import {
  createNotification,
  getMyNotifications,
  getMySentNotifications,
  markNotificationAsRead,
  markAdminNotificationAsRead,
  getNotificationLogs,
  deleteNotification
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

router.get(
  "/sent",
  protect,
  allowRoles("teacher"),
  getMySentNotifications
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

router.delete(
  "/:id",
  protect,
  allowRoles("admin", "teacher"),
  deleteNotification
)

export default router