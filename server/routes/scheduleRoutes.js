import express from "express"

import {
  getSchedules,
  getMySchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from "../controllers/scheduleController.js"

import protect from "../middleware/authMiddleware.js"

import allowRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.get(
  "/",
  protect,
  allowRoles("admin"),
  getSchedules
)

router.get(
  "/me",
  protect,
  allowRoles("teacher"),
  getMySchedules
)

router.get(
  "/:id",
  protect,
  allowRoles("admin"),
  getScheduleById
)

router.post(
  "/",
  protect,
  allowRoles("admin"),
  createSchedule
)

router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateSchedule
)

router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  deleteSchedule
)

export default router