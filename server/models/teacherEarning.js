import mongoose from "mongoose"

const teacherEarningSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true
    },

    billingMonth: {
      type: String,
      required: true
    },

    commission: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    collectedAmount: {
      type: Number,
      required: true,
      min: 0
    },

    teacherEarned: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
)

const TeacherEarning = mongoose.model(
  "TeacherEarning",
  teacherEarningSchema
)

export default TeacherEarning