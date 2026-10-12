import User from "../models/user.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import sendEmail from "../utils/sendEmail.js"

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user information",
      error: error.message
    })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      })
    }

    const user = await User.findOne({
      email: email.trim()
    })

    const message =
      "If an account exists with that email, a password reset link will be sent."

    if (!user) {
      return res.json({ message })
    }

    const resetToken = crypto.randomBytes(32).toString("hex")

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000

    await user.save()

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    try {
      await sendEmail(
        user.email,
        "SCMS Password Reset",
        `Hello ${user.name},

We received a request to reset your SCMS password.

Open this link to set a new password:
${resetUrl}

This link expires in 5 minutes and can only be used once.

If you did not request this reset, you can ignore this email.`
      )
    } catch (error) {
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()

      throw error
    }

    return res.json({ message })
  } catch (error) {
    console.error("Forgot password failed:", error.message)

    return res.status(500).json({
      message: "Unable to process password reset request"
    })
  }
}


const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      })
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset link"
      })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    return res.json({
      message: "Password reset successfully. Please log in."
    })
  } catch (error) {
    console.error("Reset password failed:", error.message)

    return res.status(500).json({
      message: "Unable to reset password"
    })
  }
}


export { login, getMe, forgotPassword, resetPassword }