import Teacher from "../models/teacher.js"
import User from "../models/user.js"
import Subject from "../models/subject.js"

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("subjects", "name")
      .sort({ teacherId: 1 })

    res.json({
      teachers
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get teachers",
      error: error.message
    })
  }
}

const createTeacher = async (req, res) => {
  let user = null

  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      subjects,
      commission
    } = req.body

    if (!name || !email || !password || commission === undefined) {
      return res.status(400).json({
        message: "Name, email, password and commission are required"
      })
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "At least one subject is required"
      })
    }

    if (commission < 0 || commission > 100) {
      return res.status(400).json({
        message: "Commission must be between 0 and 100"
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      })
    }

    const subjectCount = await Subject.countDocuments({
      _id: { $in: subjects }
    })

    if (subjectCount !== subjects.length) {
      return res.status(400).json({
        message: "One or more subjects are invalid"
      })
    }

    const lastTeacher = await Teacher.findOne()
      .sort({ teacherId: -1 })
      .select("teacherId")

    let nextNumber = 1

    if (lastTeacher) {
      nextNumber = parseInt(lastTeacher.teacherId.replace("TCH", "")) + 1
    }

    const teacherId = `TCH${String(nextNumber).padStart(3, "0")}`

    user = await User.create({
      name,
      email,
      password,
      role: "teacher"
    })

    const teacher = await Teacher.create({
      teacherId,
      userId: user._id,
      name,
      phone,
      address,
      subjects,
      commission
    })

    res.status(201).json({
      message: "Teacher created successfully",
      teacher
    })
  } catch (error) {
    if (user) {
      await User.findByIdAndDelete(user._id)
    }

    res.status(500).json({
      message: "Failed to create teacher",
      error: error.message
    })
  }
}

export { getTeachers, createTeacher }