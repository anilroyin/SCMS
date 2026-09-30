import express from "express"
import {
  getSubjects,
  createSubject
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

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createSubject
)

export default router