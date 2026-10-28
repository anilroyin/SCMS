
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

const refundSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  refundDate: {
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
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  payments: {
    type: [contributionPaymentSchema],
    default: []
  },
  refunds: {
    type: [refundSchema],
    default: []
  }
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

  // Who bears the expense?
  // centre: the centre pays the full amount
  // teachers: split equally among active teachers
  paidBy: {
    type: String,
    enum: ["centre", "teachers"],
    default: "teachers",
    required: true
  },

  // Number of active teachers when the expense was created
  teacherCountSnapshot: {
    type: Number,
    required: true,
    min: 0
  },

  allocations: {
    type: [teacherAllocationSchema],
    default: []
  },

  // Cancellation and audit details
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelReason: {
    type: String,
    trim: true,
    default: ""
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true })

expenseSchema.index({ expenseDate: 1 })
expenseSchema.index({ "allocations.teacherId": 1 })
expenseSchema.index({ isCancelled: 1, expenseDate: 1 })

const Expense = mongoose.model("Expense", expenseSchema)

export default Expense
