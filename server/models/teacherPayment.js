import mongoose from "mongoose"

const teacherPaymentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    billingMonth: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentDate: {
      type: Date,
      default: Date.now
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "other"],
      default: "cash"
    },

    note: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

const TeacherPayment = mongoose.model(
  "TeacherPayment",
  teacherPaymentSchema
)

export default TeacherPayment