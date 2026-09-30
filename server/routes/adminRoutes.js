import express from "express"
import { createUser } from "../controllers/adminController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.post(
  "/users",
  protect,
  allowRoles("admin"),
  createUser
)

export default router