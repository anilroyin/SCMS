import express from "express"
import {
  getStudents,
  getStudentById,
  updateStudentStatus,
  createStudent,
  addStudentSubject,
  removeStudentSubject
} from "../controllers/studentController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getStudents
)

router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getStudentById
)

router.put(
  "/:id/status",
  protect,
  allowRoles("admin"),
  updateStudentStatus
)

router.post(
  "/:id/subjects",
  protect,
  allowRoles("admin"),
  addStudentSubject
)

router.delete(
  "/:id/subjects/:subjectId",
  protect,
  allowRoles("admin"),
  removeStudentSubject
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createStudent
)

export default router