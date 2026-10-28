
import Expense from "../models/expense.js"
import Teacher from "../models/teacher.js"
import Notification from "../models/notification.js"

const roundAmount = amount =>
  Math.round((Number(amount || 0) + Number.EPSILON) * 100) / 100

const getDateFilter = query => {
  const filter = {}

  if (query.month && query.financialYear !== undefined) {
    throw new Error("Choose either a month or a financial year")
  }

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
      throw new Error("Financial year must be a valid starting year")
    }

    filter.$gte = new Date(year, 3, 1)
    filter.$lt = new Date(year + 1, 3, 1)
  }

  return Object.keys(filter).length ? filter : null
}

const getExpenseFilter = query => {
  const filter = { isCancelled: { $ne: true } }
  const dateFilter = getDateFilter(query)

  if (dateFilter) filter.expenseDate = dateFilter

  return filter
}

const getContributionDue = (allocation, isCancelled = false) => {
  if (isCancelled) return 0

  return roundAmount(Math.max(
    Number(allocation.allocatedAmount || 0) -
    Number(allocation.paidAmount || 0) -
    Number(allocation.advanceApplied || 0) -
    Number(allocation.reversedAmount || 0),
    0
  ))
}

const getTotalRefunded = allocation =>
  roundAmount((allocation.refunds || []).reduce(
    (total, refund) => total + Number(refund.amount || 0),
    0
  ))

const getCashRefundDue = allocation =>
  roundAmount(Math.max(
    Number(allocation.paidAmount || 0) - getTotalRefunded(allocation),
    0
  ))

const getAvailableTeacherAdvance = async teacherId => {
  const expenses = await Expense.find({
    "allocations.teacherId": teacherId
  }).select("isCancelled paidBy allocations")

  let balance = 0

  for (const expense of expenses) {
    if (expense.paidBy === "centre") continue

    const allocation = expense.allocations.find(
      item => item.teacherId.toString() === teacherId.toString()
    )

    if (!allocation) continue

    const applied = Number(allocation.advanceApplied || 0)
    balance += expense.isCancelled ? applied : -applied
  }

  return roundAmount(Math.max(balance, 0))
}

const getContributionStatus = (allocated, paid, due) => {
  if (allocated === 0 && paid === 0) return "No expenses"
  if (due <= 0) return "Paid"
  if (paid > 0) return "Partial"
  return "Due"
}

const populateExpense = query =>
  query.populate("allocations.teacherId", "name teacherId status")

const getAllocation = (expense, teacherId) =>
  expense.allocations.find(
    item => item.teacherId.toString() === teacherId.toString()
  )

const getExpenseHistoryItem = (expense, allocation) => {
  const due = getContributionDue(allocation, expense.isCancelled)

  return {
    expenseId: expense._id,
    category: expense.category,
    amount: expense.amount,
    paidBy: expense.paidBy || "teachers",
    expenseDate: expense.expenseDate,
    description: expense.description,
    allocatedAmount: allocation.allocatedAmount,
    paidAmount: allocation.paidAmount,
    advanceApplied: Number(allocation.advanceApplied || 0),
    dueAmount: due,
    isCancelled: Boolean(expense.isCancelled),
    cancelReason: expense.cancelReason || "",
    cancelledAt: expense.cancelledAt || null,
    adjustmentRequired: Boolean(allocation.adjustmentRequired),
    refundAmount: getTotalRefunded(allocation),
    refundDue: expense.isCancelled ? getCashRefundDue(allocation) : 0,
    status: expense.isCancelled
      ? "Cancelled"
      : getContributionStatus(allocation.allocatedAmount, allocation.paidAmount, due),
    payments: allocation.payments || [],
    refunds: allocation.refunds || []
  }
}

export const createExpense = async (req, res) => {
  try {
    const {
      category,
      amount,
      expenseDate,
      description,
      paidBy = "teachers"
    } = req.body

    const expenseAmount = Number(amount)
    const date = new Date(expenseDate)

    if (!category?.trim()) {
      return res.status(400).json({ message: "Expense category is required" })
    }

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid expense amount" })
    }

    if (!expenseDate || Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Enter a valid expense date" })
    }

    if (!["centre", "teachers"].includes(paidBy)) {
      return res.status(400).json({
        message: "Choose centre or teachers as the expense payer"
      })
    }

    const totalAmount = roundAmount(expenseAmount)
    let allocations = []
    let teacherCount = 0

    // Centre-paid expenses are recorded only; no teacher allocations.
    if (paidBy === "teachers") {
      const teachers = await Teacher.find({ status: "active" }).select("_id")
      teacherCount = teachers.length

      if (!teacherCount) {
        return res.status(400).json({
          message: "No active teachers are available for expense allocation"
        })
      }

      const baseShare = Math.floor((totalAmount / teacherCount) * 100) / 100
      let allocatedTotal = 0

      allocations = teachers.map((teacher, index) => {
        const allocatedAmount = index === teacherCount - 1
          ? roundAmount(totalAmount - allocatedTotal)
          : baseShare

        allocatedTotal = roundAmount(allocatedTotal + allocatedAmount)

        return {
          teacherId: teacher._id,
          allocatedAmount,
          paidAmount: 0,
          advanceApplied: 0,
          reversedAmount: 0,
          adjustmentRequired: false,
          payments: [],
          refunds: []
        }
      })
    }

    const expense = await Expense.create({
      category: category.trim(),
      amount: totalAmount,
      expenseDate: date,
      description: description?.trim() || "",
      paidBy,
      teacherCountSnapshot: teacherCount,
      allocations,
      createdBy: req.user.userId
    })

    const result = await populateExpense(Expense.findById(expense._id))

    return res.status(201).json({
      message: "Expense created successfully",
      expense: result
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const getExpenses = async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query)
    const filter = {}

    if (req.query.includeCancelled !== "true") {
      filter.isCancelled = { $ne: true }
    }

    if (dateFilter) filter.expenseDate = dateFilter

    const expenses = await populateExpense(
      Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 })
    )

    return res.status(200).json(expenses)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.find(getExpenseFilter(req.query))
    const teacherExpenses = expenses.filter(expense => expense.paidBy === "teachers")

    const totalExpenses = roundAmount(
      expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0)
    )

    const totalAllocated = roundAmount(
      teacherExpenses.reduce((total, expense) =>
        total + expense.allocations.reduce(
          (sum, allocation) => sum + Number(allocation.allocatedAmount || 0), 0
        ), 0)
    )

    const totalContributionsPaid = roundAmount(
      teacherExpenses.reduce((total, expense) =>
        total + expense.allocations.reduce(
          (sum, allocation) => sum + Number(allocation.paidAmount || 0), 0
        ), 0)
    )

    const totalContributionDue = roundAmount(
      teacherExpenses.reduce((total, expense) =>
        total + expense.allocations.reduce(
          (sum, allocation) => sum + getContributionDue(allocation), 0
        ), 0)
    )

    const totalRefundsRecorded = roundAmount(
      expenses.reduce((total, expense) =>
        total + expense.allocations.reduce(
          (sum, allocation) => sum + getTotalRefunded(allocation), 0
        ), 0)
    )

    return res.status(200).json({
      totalExpenses,
      totalAllocated,
      totalContributionsPaid,
      totalContributionDue,
      totalRefundsRecorded
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const getTeacherContributions = async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query)
    const filter = { paidBy: "teachers" }

    if (dateFilter) filter.expenseDate = dateFilter

    const expenses = await Expense.find(filter)
      .populate("allocations.teacherId", "name teacherId status")

    const teacherMap = new Map()

    for (const expense of expenses) {
      for (const allocation of expense.allocations) {
        const teacher = allocation.teacherId
        if (!teacher) continue

        const id = teacher._id.toString()

        if (!teacherMap.has(id)) {
          teacherMap.set(id, {
            teacherId: teacher._id,
            teacherCode: teacher.teacherId,
            name: teacher.name,
            totalAllocated: 0,
            totalPaid: 0,
            totalDue: 0,
            totalRefunded: 0,
            refundDue: 0,
            availableAdvance: 0,
            adjustmentRequired: false
          })
        }

        const summary = teacherMap.get(id)

        if (!expense.isCancelled) {
          summary.totalAllocated += Number(allocation.allocatedAmount || 0)
          summary.totalDue += getContributionDue(allocation)
        }

        summary.totalPaid += Number(allocation.paidAmount || 0)
        summary.totalRefunded += getTotalRefunded(allocation)

        if (expense.isCancelled) {
          summary.refundDue += getCashRefundDue(allocation)
        }

        if (allocation.adjustmentRequired) {
          summary.adjustmentRequired = true
        }
      }
    }

    const contributions = await Promise.all(
      Array.from(teacherMap.values()).map(async teacher => ({
        ...teacher,
        totalAllocated: roundAmount(teacher.totalAllocated),
        totalPaid: roundAmount(teacher.totalPaid),
        totalDue: roundAmount(teacher.totalDue),
        totalRefunded: roundAmount(teacher.totalRefunded),
        refundDue: roundAmount(teacher.refundDue),
        availableAdvance: await getAvailableTeacherAdvance(teacher.teacherId),
        status: getContributionStatus(
          teacher.totalAllocated, teacher.totalPaid, teacher.totalDue
        )
      }))
    )

    return res.status(200).json(contributions)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const getTeacherContributionHistory = async (req, res) => {
  try {
    const { teacherId } = req.params
    const dateFilter = getDateFilter(req.query)
    const filter = {
      "allocations.teacherId": teacherId,
      paidBy: "teachers"
    }

    if (dateFilter) filter.expenseDate = dateFilter

    const expenses = await Expense.find(filter).sort({
      expenseDate: -1,
      createdAt: -1
    })

    const history = expenses.map(expense => {
      const allocation = getAllocation(expense, teacherId)
      return allocation ? getExpenseHistoryItem(expense, allocation) : null
    }).filter(Boolean)

    return res.status(200).json(history)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const getMyContributions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.userId })

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" })
    }

    const dateFilter = getDateFilter(req.query)
    const filter = {
      "allocations.teacherId": teacher._id,
      paidBy: "teachers"
    }

    if (dateFilter) filter.expenseDate = dateFilter

    const expenses = await Expense.find(filter).sort({
      expenseDate: -1,
      createdAt: -1
    })

    const history = expenses.map(expense => {
      const allocation = getAllocation(expense, teacher._id)
      return allocation ? getExpenseHistoryItem(expense, allocation) : null
    }).filter(Boolean)

    const activeHistory = history.filter(item => !item.isCancelled)
    const totalAllocated = roundAmount(
      activeHistory.reduce((sum, item) => sum + Number(item.allocatedAmount || 0), 0)
    )
    const totalPaid = roundAmount(
      history.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
    )
    const totalDue = roundAmount(
      activeHistory.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0)
    )

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
        totalRefunded: roundAmount(
          history.reduce((sum, item) => sum + item.refundAmount, 0)
        ),
        refundDue: roundAmount(
          history.reduce((sum, item) => sum + item.refundDue, 0)
        ),
        availableAdvance: await getAvailableTeacherAdvance(teacher._id),
        adjustmentRequired: activeHistory.some(item => item.adjustmentRequired),
        status: getContributionStatus(totalAllocated, totalPaid, totalDue)
      },
      history
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

// Records a teacher payment against their outstanding shared expenses,
// oldest first. Centre-paid expenses are never considered.
export const recordTeacherContribution = async (req, res) => {
  try {
    const { teacherId } = req.params
    const {
      amount,
      paymentDate,
      paymentMethod = "cash",
      note,
      useAdvance = false
    } = req.body

    const cashAmount = roundAmount(amount)

    if (!Number.isFinite(Number(amount)) || cashAmount < 0) {
      return res.status(400).json({ message: "Enter a valid payment amount" })
    }

    if (!["cash", "upi", "bank_transfer", "other"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" })
    }

    const date = paymentDate ? new Date(paymentDate) : new Date()

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid payment date" })
    }

    const expenses = await Expense.find({
      paidBy: "teachers",
      isCancelled: { $ne: true },
      "allocations.teacherId": teacherId
    }).sort({ expenseDate: 1, createdAt: 1 })

    const allocations = expenses.map(expense => ({
      expense,
      allocation: getAllocation(expense, teacherId)
    })).filter(item =>
      item.allocation && getContributionDue(item.allocation) > 0
    )

    const totalDue = roundAmount(
      allocations.reduce(
        (sum, item) => sum + getContributionDue(item.allocation), 0
      )
    )

    if (totalDue <= 0) {
      return res.status(400).json({
        message: "This teacher has no outstanding contributions"
      })
    }

    const availableAdvance = useAdvance
      ? await getAvailableTeacherAdvance(teacherId)
      : 0

    const advanceUsed = roundAmount(Math.min(availableAdvance, totalDue))
    const cashLimit = roundAmount(totalDue - advanceUsed)

    if (cashAmount > cashLimit) {
      return res.status(400).json({
        message: `Payment cannot exceed ₹${cashLimit.toFixed(2)} after applying advance`
      })
    }

    if (cashAmount <= 0 && advanceUsed <= 0) {
      return res.status(400).json({
        message: "Enter a payment or select an available advance"
      })
    }

    let advanceRemaining = advanceUsed
    let cashRemaining = cashAmount

    for (const { expense, allocation } of allocations) {
      let due = getContributionDue(allocation)

      if (advanceRemaining > 0 && due > 0) {
        const applied = roundAmount(Math.min(advanceRemaining, due))
        allocation.advanceApplied = roundAmount(
          Number(allocation.advanceApplied || 0) + applied
        )
        advanceRemaining = roundAmount(advanceRemaining - applied)
        due = roundAmount(due - applied)
      }

      if (cashRemaining > 0 && due > 0) {
        const paid = roundAmount(Math.min(cashRemaining, due))

        allocation.payments.push({
          amount: paid,
          paymentDate: date,
          paymentMethod,
          note: note?.trim() || ""
        })

        allocation.paidAmount = roundAmount(
          Number(allocation.paidAmount || 0) + paid
        )

        cashRemaining = roundAmount(cashRemaining - paid)
      }

      await expense.save()

      if (advanceRemaining <= 0 && cashRemaining <= 0) break
    }

    const updatedExpenses = await Expense.find({
      paidBy: "teachers",
      "allocations.teacherId": teacherId
    })

    let paidTotal = 0
    let dueTotal = 0

    for (const expense of updatedExpenses) {
      const allocation = getAllocation(expense, teacherId)
      if (!allocation) continue

      paidTotal += Number(allocation.paidAmount || 0)
      dueTotal += getContributionDue(allocation, expense.isCancelled)
    }

    return res.status(200).json({
      message: "Teacher contribution recorded successfully",
      paidThisTime: cashAmount,
      advanceUsed,
      paidAmount: roundAmount(paidTotal),
      availableAdvance: await getAvailableTeacherAdvance(teacherId),
      dueAmount: roundAmount(dueTotal),
      status: dueTotal <= 0 ? "Paid" : paidTotal > 0 ? "Partial" : "Due"
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const cancelExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    const { cancelReason } = req.body

    if (!cancelReason?.trim()) {
      return res.status(400).json({ message: "Cancellation reason is required" })
    }

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (expense.isCancelled) {
      return res.status(400).json({ message: "Expense is already cancelled" })
    }

    for (const allocation of expense.allocations) {
      const unpaid = getContributionDue(allocation)

      allocation.reversedAmount = roundAmount(
        Number(allocation.reversedAmount || 0) + unpaid
      )

      if (
        Number(allocation.paidAmount || 0) > 0 ||
        Number(allocation.advanceApplied || 0) > 0
      ) {
        allocation.adjustmentRequired = true
      }
    }

    expense.isCancelled = true
    expense.cancelledAt = new Date()
    expense.cancelReason = cancelReason.trim()

    if (expense.schema.path("cancelledBy")) {
      expense.cancelledBy = req.user.userId
    }

    await expense.save()

    const notifications = []

    for (const allocation of expense.allocations) {
      if (
        getCashRefundDue(allocation) <= 0 &&
        Number(allocation.advanceApplied || 0) <= 0
      ) continue

      const teacher = await Teacher.findById(allocation.teacherId).select("userId")
      if (!teacher?.userId) continue

      const refundDue = getCashRefundDue(allocation)
      const message = refundDue > 0
        ? `The expense "${expense.category}" has been cancelled. A cash contribution refund of ₹${refundDue.toFixed(2)} is pending. Please contact the coaching centre office.`
        : `The expense "${expense.category}" has been cancelled. Your applied advance requires adjustment. Please contact the coaching centre office.`

      notifications.push({
        sender: req.user.userId,
        senderRole: "admin",
        targetType: "individual_teacher",
        recipients: [teacher.userId],
        title: "Expense Cancelled",
        message
      })
    }

    if (notifications.length) await Notification.insertMany(notifications)

    return res.status(200).json({
      message: "Expense cancelled successfully. Affected teachers have been notified.",
      refundsToRecord: expense.allocations.map(allocation => ({
        teacherId: allocation.teacherId,
        paidAmount: Number(allocation.paidAmount || 0),
        alreadyRefunded: getTotalRefunded(allocation),
        refundDue: getCashRefundDue(allocation),
        advanceApplied: Number(allocation.advanceApplied || 0)
      })).filter(item => item.refundDue > 0 || item.advanceApplied > 0),
      expense
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const recordTeacherRefund = async (req, res) => {
  try {
    const { expenseId, teacherId } = req.params
    const { amount, refundDate, paymentMethod = "cash", note } = req.body
    const refundAmount = roundAmount(amount)

    if (!Number.isFinite(Number(amount)) || refundAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid refund amount" })
    }

    if (!["cash", "upi", "bank_transfer", "other"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid refund payment method" })
    }

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (!expense.isCancelled) {
      return res.status(400).json({
        message: "Refunds can only be recorded for cancelled expenses"
      })
    }

    const allocation = getAllocation(expense, teacherId)

    if (!allocation) {
      return res.status(404).json({
        message: "Teacher allocation not found for this expense"
      })
    }

    const refundDue = getCashRefundDue(allocation)

    if (refundAmount > refundDue) {
      return res.status(400).json({
        message: `Refund cannot exceed the remaining ₹${refundDue.toFixed(2)}`
      })
    }

    const date = refundDate ? new Date(refundDate) : new Date()

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid refund date" })
    }

    allocation.refunds.push({
      amount: refundAmount,
      refundDate: date,
      paymentMethod,
      note: note?.trim() || "",
      recordedBy: req.user.userId
    })

    await expense.save()

    return res.status(200).json({
      message: "Teacher refund recorded successfully",
      refundedAmount: getTotalRefunded(allocation),
      refundDue: getCashRefundDue(allocation)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}