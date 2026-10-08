import express from "express"

import {
  getFeeReport,
  getTeacherPaymentReport,
  getStudentReport,
  getFinancialSummary
} from "../controllers/reportController.js"


const router = express.Router()


router.get("/fees", getFeeReport)

router.get(
  "/teacher-payments",
  getTeacherPaymentReport
)

router.get(
  "/students",
  getStudentReport
)

router.get(
  "/summary",
  getFinancialSummary
)


export default router