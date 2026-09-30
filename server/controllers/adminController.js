import User from "../models/user.js"

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required"
      })
    }

    if (!["teacher", "student"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    })

    const roleName = role === "teacher" ? "Teacher" : "Student"

    res.status(201).json({
      message: `${roleName} created successfully`,
      user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
  }
})
  } catch (error) {
    res.status(500).json({
      message: "Failed to create user",
      error: error.message
    })
  }
}

export { createUser }