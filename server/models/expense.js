
import mongoose from "mongoose"

const contributionPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "bank_transfer", "other"],
    default: "cash"
  },
  note: {
    type: String,
    trim: true,
    default: ""
  }
}, { timestamps: true })

const teacherAllocationSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true
  },
  allocatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  advanceApplied: {
    type: Number,
    default: 0,
    min: 0
  },
  reversedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  adjustmentRequired: {
    type: Boolean,
    default: false
  },
  payments: [contributionPaymentSchema]
}, { timestamps: true })

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  expenseDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  teacherCountSnapshot: {
    type: Number,
    required: true,
    min: 0
  },
  allocations: [teacherAllocationSchema],
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelReason: {
    type: String,
    trim: true,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true })

expenseSchema.index({ expenseDate: 1, isCancelled: 1 })
expenseSchema.index({ "allocations.teacherId": 1 })

const Expense = mongoose.model("Expense", expenseSchema)

export default Expense
