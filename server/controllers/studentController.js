import Student from "../models/student.js"
import User from "../models/user.js"
import Subject from "../models/subject.js"
import Teacher from "../models/teacher.js"

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("subjects.subjectId", "name")
      .populate("subjects.teacherId", "name")
      .sort({ studentId: 1 })

    res.json({
      students
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get students",
      error: error.message
    })
  }
}

const createStudent = async (req, res) => {
  let user = null

  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      gender,
      phone,
      guardianName,
      address,
      school,
      className,
      board,
      subjects,
      discount
    } = req.body

    if (!name || !email || !password || !className) {
      return res.status(400).json({
        message: "Name, email, password and class are required"
      })
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "At least one subject is required"
      })
    }

    const studentDiscount = discount || 0

    if (studentDiscount < 0 || studentDiscount > 100) {
      return res.status(400).json({
        message: "Discount must be between 0 and 100"
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      })
    }

    const subjectIds = subjects.map(
      (subject) => subject.subjectId
    )

    const teacherIds = subjects.map(
      (subject) => subject.teacherId
    )

    const uniqueSubjectIds = [...new Set(subjectIds)]

    if (subjectIds.length !== uniqueSubjectIds.length) {
      return res.status(400).json({
        message: "A subject cannot be added more than once"
      })
    }

    const subjectCount = await Subject.countDocuments({
      _id: { $in: uniqueSubjectIds }
    })

    if (subjectCount !== uniqueSubjectIds.length) {
      return res.status(400).json({
        message: "One or more subjects are invalid"
      })
    }

    const uniqueTeacherIds = [...new Set(teacherIds)]

    const teacherCount = await Teacher.countDocuments({
      _id: { $in: uniqueTeacherIds }
    })

    if (teacherCount !== uniqueTeacherIds.length) {
      return res.status(400).json({
        message: "One or more teachers are invalid"
      })
    }

    for (const subject of subjects) {
      const teacher = await Teacher.findOne({
        _id: subject.teacherId,
        subjects: subject.subjectId
      })

      if (!teacher) {
        return res.status(400).json({
          message: "Selected teacher does not teach the selected subject"
        })
      }

      if (subject.fee === undefined || subject.fee < 0) {
        return res.status(400).json({
          message: "Subject fee must be provided"
        })
      }
    }

    const lastStudent = await Student.findOne()
      .sort({ studentId: -1 })
      .select("studentId")

    let nextNumber = 1

    if (lastStudent) {
      nextNumber =
        parseInt(lastStudent.studentId.replace("STU", "")) + 1
    }

    const studentId = `STU${String(nextNumber).padStart(3, "0")}`

    const studentSubjects = subjects.map((subject) => ({
      subjectId: subject.subjectId,
      teacherId: subject.teacherId,
      fee: subject.fee,
      status: "active",
      startedAt: new Date()
    }))

    user = await User.create({
      name,
      email,
      password,
      role: "student"
    })

    const student = await Student.create({
      studentId,
      userId: user._id,
      name,
      dateOfBirth,
      gender,
      phone,
      guardianName,
      address,
      school,
      className,
      board,
      subjects: studentSubjects,
      discount: studentDiscount,
      status: "active"
    })

    res.status(201).json({
      message: "Student admitted successfully",
      student
    })
  } catch (error) {
    if (user) {
      await User.findByIdAndDelete(user._id)
    }

    res.status(500).json({
      message: "Failed to admit student",
      error: error.message
    })
  }
}

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("subjects.subjectId", "name")
      .populate("subjects.teacherId", "name")

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      })
    }

    res.json({
      student
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get student",
      error: error.message
    })
  }
}

const updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!["active", "paused", "left"].includes(status)) {
      return res.status(400).json({
        message: "Invalid student status"
      })
    }

    const student = await Student.findById(req.params.id)

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      })
    }

    const currentDate = new Date()

    student.status = status

    if (status === "paused") {
      student.pausedAt = currentDate
    }

    if (status === "active") {
      student.resumedAt = currentDate
    }

    if (status === "left") {
      student.leftAt = currentDate
    }

    await student.save()

    res.json({
      message: "Student status updated successfully",
      student
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to update student status",
      error: error.message
    })
  }
}

export {
  getStudents,
  getStudentById,
  updateStudentStatus,
  createStudent
}