import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDb from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import studentRoutes from "./routes/studentRoutes.js"
import subjectRoutes from "./routes/subjectRoutes.js"
import teacherRoutes from "./routes/teacherRoutes.js"
import feeRoutes from "./routes/feeRoutes.js"
import teacherEarningRoutes from "./routes/teacherEarningRoutes.js"
import teacherPaymentRoutes from "./routes/teacherPaymentRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"

dotenv.config({ quiet: true })

const app = express()

const PORT = 3000

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/teachers", teacherRoutes)
app.use("/api/fees", feeRoutes)

app.use(
  "/api/teacher-earnings",
  teacherEarningRoutes
)

app.use(
  "/api/teacher-payments",
  teacherPaymentRoutes
)

app.use(
  "/api/schedules",
  scheduleRoutes
)

app.use(
  "/api/notifications",
  notificationRoutes
)

connectDb()

app.get("/", (req, res) => {
  res.send("SCMS backend is running")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})