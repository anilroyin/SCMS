import express from "express"
import {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject
} from "../controllers/subjectController.js"
import protect from "../middleware/authMiddleware.js"
import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getSubjects
)

router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getSubjectById
)

router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateSubject
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createSubject
)

export default router