import express from "express"
import { getAdminDashboard } from "../controllers/dashboardController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get("/admin", protect, allowRoles("admin"), getAdminDashboard)

export default router