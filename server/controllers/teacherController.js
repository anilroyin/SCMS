import Teacher from "../models/teacher.js"
import User from "../models/user.js"
import Subject from "../models/subject.js"
import Student from "../models/student.js"

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("subjects", "name")
      .sort({ teacherId: 1 })

    const teachersWithStudentCount = await Promise.all(
      teachers.map(async (teacher) => {
        const studentCount = await Student.countDocuments({
          "subjects.teacherId": teacher._id
        })

        return {
          ...teacher.toObject(),
          studentCount
        }
      })
    )

    res.json({
      teachers: teachersWithStudentCount
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
      dateOfBirth,
      gender,
      email,
      password,
      phone,
      address,
      subjects,
      commission
    } = req.body

    if (
      !name ||
      !dateOfBirth ||
      !gender ||
      !email ||
      !password ||
      commission === undefined
    ) {
      return res.status(400).json({
        message: "Name, date of birth, gender, email, password and commission are required"
      })
    }

    if (!["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        message: "Invalid gender"
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
      nextNumber =
        parseInt(lastTeacher.teacherId.replace("TCH", "")) + 1
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
      dateOfBirth,
      gender,
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

const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("subjects", "name")
      .populate("userId", "email")

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const students = await Student.find({
      "subjects.teacherId": teacher._id
    })
      .select("studentId name className status subjects")
      .populate("subjects.subjectId", "name")

    const teacherStudents = students.map((student) => {
      const teacherSubjects = student.subjects.filter(
        (subject) =>
          subject.teacherId.toString() === teacher._id.toString()
      )

      return {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        status: student.status,
        subjects: teacherSubjects.map(
          (subject) => subject.subjectId
        )
      }
    })

    res.json({
      teacher,
      students: teacherStudents
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get teacher",
      error: error.message
    })
  }
}

const updateTeacher = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      subjects,
      commission,
      status
    } = req.body

    if (
      !name ||
      !dateOfBirth ||
      !gender ||
      !email ||
      commission === undefined ||
      !status
    ) {
      return res.status(400).json({
        message: "Name, date of birth, gender, email, commission and status are required"
      })
    }

    if (!["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        message: "Invalid gender"
      })
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid teacher status"
      })
    }

    if (commission < 0 || commission > 100) {
      return res.status(400).json({
        message: "Commission must be between 0 and 100"
      })
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "At least one subject is required"
      })
    }

    const teacher = await Teacher.findById(req.params.id)

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: teacher.userId }
    })

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      })
    }

    const uniqueSubjects = [...new Set(subjects)]

    if (uniqueSubjects.length !== subjects.length) {
      return res.status(400).json({
        message: "A subject cannot be added more than once"
      })
    }

    const subjectCount = await Subject.countDocuments({
      _id: { $in: uniqueSubjects }
    })

    if (subjectCount !== uniqueSubjects.length) {
      return res.status(400).json({
        message: "One or more subjects are invalid"
      })
    }

    const currentSubjectIds = teacher.subjects.map(
      (subject) => subject.toString()
    )

    const removedSubjects = currentSubjectIds.filter(
      (subjectId) => !uniqueSubjects.includes(subjectId)
    )

    if (removedSubjects.length > 0) {
      const studentsUsingRemovedSubjects = await Student.findOne({
        subjects: {
          $elemMatch: {
            teacherId: teacher._id,
            subjectId: { $in: removedSubjects }
          }
        }
      })

      if (studentsUsingRemovedSubjects) {
        return res.status(400).json({
          message: "Cannot remove a subject because students are currently enrolled with this teacher for that subject"
        })
      }
    }

    teacher.name = name
    teacher.dateOfBirth = dateOfBirth
    teacher.gender = gender
    teacher.phone = phone
    teacher.address = address
    teacher.subjects = uniqueSubjects
    teacher.commission = commission
    teacher.status = status

    await teacher.save()

    const user = await User.findById(teacher.userId)

    if (user) {
      user.name = name
      user.email = email

      await user.save()
    }

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate("subjects", "name")
      .populate("userId", "email")

    res.json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to update teacher",
      error: error.message
    })
  }
}

export {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher
}