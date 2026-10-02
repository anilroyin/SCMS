import Subject from "../models/subject.js"
import Teacher from "../models/teacher.js"
import Student from "../models/student.js"

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 })

    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const teacherCount = await Teacher.countDocuments({
          subjects: subject._id
        })

        const studentCount = await Student.countDocuments({
          "subjects.subjectId": subject._id
        })

        return {
          ...subject.toObject(),
          teacherCount,
          studentCount
        }
      })
    )

    res.json({
      subjects: subjectsWithCounts
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get subjects",
      error: error.message
    })
  }
}

const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        message: "Subject name is required"
      })
    }

    const existingSubject = await Subject.findOne({ name })

    if (existingSubject) {
      return res.status(409).json({
        message: "Subject already exists"
      })
    }

    const subject = await Subject.create({
      name,
      description
    })

    res.status(201).json({
      message: "Subject created successfully",
      subject
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to create subject",
      error: error.message
    })
  }
}

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found"
      })
    }

    const teachers = await Teacher.find({
      subjects: subject._id
    })
      .select("teacherId name commission status")

    const students = await Student.find({
      "subjects.subjectId": subject._id
    })
      .select("studentId name className status subjects")
      .populate("subjects.teacherId", "name")

    const subjectStudents = students.map((student) => {
      const enrollment = student.subjects.find(
        (studentSubject) =>
          studentSubject.subjectId.toString() ===
          subject._id.toString()
      )

      return {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        status: student.status,
        teacher: enrollment?.teacherId || null,
        fee: enrollment?.fee || 0
      }
    })

    res.json({
      subject,
      teachers,
      students: subjectStudents
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get subject",
      error: error.message
    })
  }
}

const updateSubject = async (req, res) => {
  try {
    const { name, description, status } = req.body

    if (!name || !status) {
      return res.status(400).json({
        message: "Subject name and status are required"
      })
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid subject status"
      })
    }

    const subject = await Subject.findById(req.params.id)

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found"
      })
    }

    const existingSubject = await Subject.findOne({
      name,
      _id: { $ne: subject._id }
    })

    if (existingSubject) {
      return res.status(409).json({
        message: "Subject already exists"
      })
    }

    subject.name = name
    subject.description = description
    subject.status = status

    await subject.save()

    res.json({
      message: "Subject updated successfully",
      subject
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to update subject",
      error: error.message
    })
  }
}
export {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject
}