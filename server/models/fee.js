import mongoose from "mongoose"

const feeSchema = new mongoose.Schema(
  {
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

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    billingMonth: {
      type: String,
      required: true
    },

    originalFee: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    netFee: {
      type: Number,
      required: true,
      min: 0
    },

    commission: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    centerShare: {
      type: Number,
      required: true,
      min: 0
    },

    teacherShare: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    dueAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ["due", "partial", "paid"],
      default: "due"
    },

    paymentDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

feeSchema.index(
  {
    studentId: 1,
    subjectId: 1,
    billingMonth: 1
  },
  {
    unique: true
  }
)

const Fee = mongoose.model("Fee", feeSchema)

export default Fee