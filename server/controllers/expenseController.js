import Expense from "../models/expense.js"
import Teacher from "../models/teacher.js"

const roundAmount = amount =>
  Math.round((amount + Number.EPSILON) * 100) / 100

const getDateFilter = query => {
  const filter = {}

  if (query.month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) {
      throw new Error("Month must be in YYYY-MM format")
    }

    const [year, month] = query.month.split("-").map(Number)
    filter.$gte = new Date(year, month - 1, 1)
    filter.$lt = new Date(year, month, 1)
  } else if (query.financialYear !== undefined) {
    const year = Number(query.financialYear)

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error("Invalid financial year")
    }

    filter.$gte = new Date(year, 3, 1)
    filter.$lt = new Date(year + 1, 3, 1)
  }

  return Object.keys(filter).length ? filter : null
}

const getExpenseFilter = query => {
  const filter = { isCancelled: false }
  const dateFilter = getDateFilter(query)

  if (dateFilter) {
    filter.expenseDate = dateFilter
  }

  return filter
}

const getContributionDue = allocation => {
  return roundAmount(
    Math.max(
      Number(allocation.allocatedAmount || 0) -
        Number(allocation.paidAmount || 0),
      0
    )
  )
}

const getTotalRefunded = allocation => {
  return roundAmount(
    (allocation.refunds || []).reduce(
      (total, refund) => total + Number(refund.amount || 0),
      0
    )
  )
}

const getRefundDue = allocation => {
  return roundAmount(
    Math.max(
      Number(allocation.paidAmount || 0) -
        getTotalRefunded(allocation),
      0
    )
  )
}

const getContributionStatus = (allocated, paid, due) => {
  if (allocated === 0 && paid === 0) return "No expenses"
  if (due <= 0) return "Paid"
  if (paid > 0) return "Partial"
  return "Due"
}

const getRefundStatus = allocation => {
  if (getRefundDue(allocation) <= 0) return "Refunded"
  return "Refund Pending"
}

const populateExpense = query => {
  return query.populate("allocations.teacherId", "name teacherId status")
}

export const createExpense = async (req, res) => {
  try {
    const { category, amount, expenseDate, description } = req.body
    const expenseAmount = Number(amount)
    const date = new Date(expenseDate)

    if (!category?.trim()) {
      return res.status(400).json({
        message: "Expense category is required"
      })
    }

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        message: "Enter a valid expense amount"
      })
    }

    if (!expenseDate || Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Enter a valid expense date"
      })
    }

    const teachers = await Teacher.find({
      status: "active"
    }).select("_id")

    const totalAmount = roundAmount(expenseAmount)
    const teacherCount = teachers.length
    const baseShare = teacherCount
      ? Math.floor((totalAmount / teacherCount) * 100) / 100
      : 0

    let allocatedTotal = 0

    const allocations = teachers.map((teacher, index) => {
      const allocatedAmount = index === teacherCount - 1
        ? roundAmount(totalAmount - allocatedTotal)
        : baseShare

      allocatedTotal = roundAmount(
        allocatedTotal + allocatedAmount
      )

      return {
        teacherId: teacher._id,
        allocatedAmount,
        paidAmount: 0,
        payments: [],
        refunds: []
      }
    })

    const expense = await Expense.create({
      category: category.trim(),
      amount: totalAmount,
      expenseDate: date,
      description: description?.trim() || "",
      teacherCountSnapshot: teacherCount,
      allocations,
      createdBy: req.user.userId
    })

    const result = await populateExpense(
      Expense.findById(expense._id)
    )

    return res.status(201).json({
      message: "Expense created successfully",
      expense: result
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

export const getExpenses = async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query)

    const filter = req.query.includeCancelled === "true"
      ? (dateFilter ? { expenseDate: dateFilter } : {})
      : getExpenseFilter(req.query)

    const expenses = await populateExpense(
      Expense.find(filter).sort({
        expenseDate: -1,
        createdAt: -1
      })
    )

    return res.status(200).json(expenses)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

export const getExpenseSummary = async (req, res) => {
  try {
    const filter = getExpenseFilter(req.query)
    const expenses = await Expense.find(filter)

    const totalExpenses = roundAmount(
      expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0
      )
    )

    const totalAllocated = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) =>
            sum + Number(allocation.allocatedAmount || 0),
          0
        )
      }, 0)
    )

    const totalContributionsPaid = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) =>
            sum + Number(allocation.paidAmount || 0),
          0
        )
      }, 0)
    )

    const totalContributionDue = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) =>
            sum + getContributionDue(allocation),
          0
        )
      }, 0)
    )

    return res.status(200).json({
      totalExpenses,
      totalAllocated,
      totalContributionsPaid,
      totalContributionDue
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

export const getTeacherContributions = async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query)

    const expenses = await Expense.find(
      dateFilter ? { expenseDate: dateFilter } : {}
    ).populate("allocations.teacherId", "name teacherId status")

    const teacherMap = new Map()

    for (const expense of expenses) {
      for (const allocation of expense.allocations) {
        const teacher = allocation.teacherId

        if (!teacher) continue

        const teacherId = teacher._id.toString()

        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacherId: teacher._id,
            teacherCode: teacher.teacherId,
            name: teacher.name,
            totalAllocated: 0,
            totalPaid: 0,
            totalDue: 0
          })
        }

        const summary = teacherMap.get(teacherId)

        if (!expense.isCancelled) {
          summary.totalAllocated += Number(
            allocation.allocatedAmount || 0
          )
          summary.totalDue += getContributionDue(allocation)
        }

        summary.totalPaid += Number(allocation.paidAmount || 0)
      }
    }

    const contributions = Array.from(
      teacherMap.values()
    ).map(teacher => ({
      ...teacher,
      totalAllocated: roundAmount(teacher.totalAllocated),
      totalPaid: roundAmount(teacher.totalPaid),
      totalDue: roundAmount(teacher.totalDue),
      status: getContributionStatus(
        teacher.totalAllocated,
        teacher.totalPaid,
        teacher.totalDue
      )
    }))

    return res.status(200).json(contributions)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

export const getTeacherContributionHistory = async (req, res) => {
  try {
    const { teacherId } = req.params
    const dateFilter = getDateFilter(req.query)

    const filter = {
      "allocations.teacherId": teacherId
    }

    if (dateFilter) {
      filter.expenseDate = dateFilter
    }

    const expenses = await Expense.find(filter).sort({
      expenseDate: -1,
      createdAt: -1
    })

    const history = expenses.map(expense => {
      const allocation = expense.allocations.find(
        item => item.teacherId.toString() === teacherId
      )

      if (!allocation) return null

      const due = getContributionDue(allocation)
      const refundedAmount = getTotalRefunded(allocation)
      const refundDue = getRefundDue(allocation)

      return {
        expenseId: expense._id,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        description: expense.description,
        allocatedAmount: allocation.allocatedAmount,
        paidAmount: allocation.paidAmount,
        dueAmount: expense.isCancelled ? 0 : due,
        refundedAmount,
        refundDue,
        isCancelled: expense.isCancelled,
        status: expense.isCancelled
          ? getRefundStatus(allocation)
          : getContributionStatus(
              allocation.allocatedAmount,
              allocation.paidAmount,
              due
            ),
        payments: allocation.payments,
        refunds: allocation.refunds || []
      }
    }).filter(Boolean)

    return res.status(200).json(history)
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

export const getMyContributions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      userId: req.user.userId
    })

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found"
      })
    }

    const dateFilter = getDateFilter(req.query)
    const filter = {
      "allocations.teacherId": teacher._id
    }

    if (dateFilter) {
      filter.expenseDate = dateFilter
    }

    const expenses = await Expense.find(filter).sort({
      expenseDate: -1,
      createdAt: -1
    })

    let totalAllocated = 0
    let totalPaid = 0
    let totalDue = 0

    const history = expenses.map(expense => {
      const allocation = expense.allocations.find(
        item =>
          item.teacherId.toString() === teacher._id.toString()
      )

      if (!allocation) return null

      const due = getContributionDue(allocation)
      const refundedAmount = getTotalRefunded(allocation)
      const refundDue = getRefundDue(allocation)

      if (!expense.isCancelled) {
        totalAllocated += Number(allocation.allocatedAmount || 0)
        totalDue += due
      }

      totalPaid += Number(allocation.paidAmount || 0)

      return {
        expenseId: expense._id,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        description: expense.description,
        allocatedAmount: allocation.allocatedAmount,
        paidAmount: allocation.paidAmount,
        dueAmount: expense.isCancelled ? 0 : due,
        refundedAmount,
        refundDue,
        isCancelled: expense.isCancelled,
        status: expense.isCancelled
          ? getRefundStatus(allocation)
          : getContributionStatus(
              allocation.allocatedAmount,
              allocation.paidAmount,
              due
            ),
        payments: allocation.payments,
        refunds: allocation.refunds || []
      }
    }).filter(Boolean)

    totalAllocated = roundAmount(totalAllocated)
    totalPaid = roundAmount(totalPaid)
    totalDue = roundAmount(totalDue)

    return res.status(200).json({
      teacher: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name
      },
      summary: {
        totalAllocated,
        totalPaid,
        totalDue,
        status: getContributionStatus(
          totalAllocated,
          totalPaid,
          totalDue
        )
      },
      history
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

export const recordTeacherContribution = async (req, res) => {
  try {
    const { teacherId } = req.params
    const {
      amount,
      paymentDate,
      paymentMethod,
      note
    } = req.body

    const paymentAmount = roundAmount(Number(amount ?? 0))

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Enter a valid payment amount"
      })
    }

    if (!teacherId) {
      return res.status(400).json({
        message: "Teacher ID is required"
      })
    }

    const date = paymentDate ? new Date(paymentDate) : new Date()

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid payment date"
      })
    }

    const method = paymentMethod || "cash"

    if (!["cash", "upi", "bank_transfer", "other"].includes(method)) {
      return res.status(400).json({
        message: "Invalid payment method"
      })
    }

    // Find this teacher's non-cancelled expenses, oldest first.
    const expenses = await Expense.find({
      isCancelled: { $ne: true },
      "allocations.teacherId": teacherId
    }).sort({
      expenseDate: 1,
      createdAt: 1
    })

    const outstandingAllocations = []
    let totalAllocated = 0
    let totalPaidBefore = 0
    let totalDueBefore = 0

    for (const expense of expenses) {
      const allocation = expense.allocations.find(
        item => item.teacherId.toString() === teacherId.toString()
      )

      if (!allocation) continue

      const allocated = Number(allocation.allocatedAmount || 0)
      const paid = Number(allocation.paidAmount || 0)
      const due = getContributionDue(allocation)

      totalAllocated += allocated
      totalPaidBefore += paid
      totalDueBefore += due

      if (due > 0) {
        outstandingAllocations.push({
          expense,
          allocation,
          due
        })
      }
    }

    totalAllocated = roundAmount(totalAllocated)
    totalPaidBefore = roundAmount(totalPaidBefore)
    totalDueBefore = roundAmount(totalDueBefore)

    if (outstandingAllocations.length === 0 || totalDueBefore <= 0) {
      return res.status(400).json({
        message: "This teacher has no outstanding contribution"
      })
    }

    if (paymentAmount > totalDueBefore) {
      return res.status(400).json({
        message: `Payment cannot exceed the outstanding amount of ₹${totalDueBefore.toFixed(2)}`
      })
    }

    let remainingPayment = paymentAmount

    for (const item of outstandingAllocations) {
      if (remainingPayment <= 0) break

      const amountForExpense = roundAmount(
        Math.min(remainingPayment, item.due)
      )

      if (amountForExpense <= 0) continue

      if (!Array.isArray(item.allocation.payments)) {
        item.allocation.payments = []
      }

      item.allocation.payments.push({
        amount: amountForExpense,
        paymentDate: date,
        paymentMethod: method,
        note: note?.trim() || ""
      })

      item.allocation.paidAmount = roundAmount(
        Number(item.allocation.paidAmount || 0) + amountForExpense
      )

      remainingPayment = roundAmount(
        remainingPayment - amountForExpense
      )

      await item.expense.save()
    }

    const totalPaid = roundAmount(totalPaidBefore + paymentAmount)
    const totalDue = roundAmount(totalDueBefore - paymentAmount)

    return res.status(200).json({
      message: "Teacher contribution recorded successfully",
      paidAmount: totalPaid,
      dueAmount: totalDue,
      status: getContributionStatus(
        totalAllocated,
        totalPaid,
        totalDue
      )
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

export const cancelExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    const { cancelReason } = req.body

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      })
    }

    if (expense.isCancelled) {
      return res.status(400).json({
        message: "Expense is already cancelled"
      })
    }

    expense.isCancelled = true
    expense.cancelledAt = new Date()
    expense.cancelReason = cancelReason?.trim() || ""

    await expense.save()

    const result = await populateExpense(
      Expense.findById(expense._id)
    )

    return res.status(200).json({
      message: "Expense cancelled successfully",
      expense: result
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

export const recordTeacherRefund = async (req, res) => {
  try {
    const { expenseId, teacherId } = req.params
    const {
      amount,
      refundDate,
      paymentMethod,
      note
    } = req.body

    const refundAmount = roundAmount(Number(amount ?? 0))

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({
        message: "Enter a valid refund amount"
      })
    }

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      })
    }

    if (!expense.isCancelled) {
      return res.status(400).json({
        message: "Refunds can only be recorded for cancelled expenses"
      })
    }

    const allocation = expense.allocations.find(
      item => item.teacherId.toString() === teacherId.toString()
    )

    if (!allocation) {
      return res.status(404).json({
        message: "Teacher allocation not found for this expense"
      })
    }

    const refundDue = getRefundDue(allocation)

    if (refundDue <= 0) {
      return res.status(400).json({
        message: "This teacher has no outstanding refund"
      })
    }

    if (refundAmount > refundDue) {
      return res.status(400).json({
        message: `Refund cannot exceed the outstanding amount of ₹${refundDue.toFixed(2)}`
      })
    }

    const date = refundDate ? new Date(refundDate) : new Date()

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid refund date"
      })
    }

    const method = paymentMethod || "cash"

    if (!["cash", "upi", "bank_transfer", "other"].includes(method)) {
      return res.status(400).json({
        message: "Invalid refund payment method"
      })
    }

    if (!Array.isArray(allocation.refunds)) {
      allocation.refunds = []
    }

    allocation.refunds.push({
      amount: refundAmount,
      refundDate: date,
      paymentMethod: method,
      note: note?.trim() || "",
      recordedBy: req.user.userId
    })

    await expense.save()

    const updatedRefundDue = getRefundDue(allocation)

    return res.status(200).json({
      message: updatedRefundDue <= 0
        ? "Teacher refund recorded. Status: Refunded"
        : "Teacher refund recorded. Refund is still pending",
      refundedAmount: getTotalRefunded(allocation),
      refundDue: updatedRefundDue,
      status: updatedRefundDue <= 0
        ? "Refunded"
        : "Refund Pending"
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}