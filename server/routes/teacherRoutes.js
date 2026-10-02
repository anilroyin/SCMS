import express from "express"
import {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher
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

router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getTeacherById
)

router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateTeacher
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createTeacher
)

export default router