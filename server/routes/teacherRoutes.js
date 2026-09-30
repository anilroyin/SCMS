import express from "express"
import {
  getTeachers,
  createTeacher
} from "../controllers/teacherController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getTeachers
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createTeacher
)

export default router