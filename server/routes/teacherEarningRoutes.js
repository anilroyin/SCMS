import express from "express"

import {
  getTeacherEarnings,
  getMyTeacherEarnings,
  getTeacherEarningDetails
} from "../controllers/teacherEarningController.js"

import protect from "../middleware/authMiddleware.js"

import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getTeacherEarnings
)

router.get(
  "/me",
  protect,
  allowRoles("teacher"),
  getMyTeacherEarnings
)

router.get(
  "/:teacherId",
  protect,
  allowRoles("admin"),
  getTeacherEarningDetails
)

export default router