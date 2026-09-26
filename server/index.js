import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/db.js"

dotenv.config({ quiet: true })

const app = express()

const PORT = 3000

connectDb()

app.get("/", (req, res) => {
  res.send("SCMS backend is running")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})