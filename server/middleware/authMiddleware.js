import jwt from "jsonwebtoken"
import User from "../models/user.js"

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required"
      })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)
      .select("role")

    if (!user || user.role !== decoded.role) {
      return res.status(401).json({
        message: "Your session has expired! Please log in again."
      })
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role
    }

    next()
  } catch (error) {
    return res.status(401).json({
      message: "Your session has expired! Please log in again."
    })
  }
}

export default protect