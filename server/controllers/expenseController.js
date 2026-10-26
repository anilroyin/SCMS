
import Expense from "../models/expense.js"
import Teacher from "../models/teacher.js"

const roundAmount = amount => Math.round((amount + Number.EPSILON) * 100) / 100

const getDateFilter = (query) => {
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

const getExpenseFilter = (query) => {
  const filter = { isCancelled: false }
  const dateFilter = getDateFilter(query)

  if (dateFilter) {
    filter.expenseDate = dateFilter
  }

  return filter
}

const getContributionDue = (allocation, isCancelled) => {
  if (isCancelled) return 0

  return roundAmount(
    Math.max(
      allocation.allocatedAmount -
      allocation.paidAmount -
      (allocation.advanceApplied || 0) -
      allocation.reversedAmount,
      0
    )
  )
}

const getAvailableTeacherAdvances = async (teacherIds) => {
  const advances = new Map(
    teacherIds.map(teacherId => [teacherId.toString(), 0])
  )

  const expenses = await Expense.find({
    "allocations.teacherId": { $in: teacherIds }
  }).select("isCancelled allocations.teacherId allocations.paidAmount allocations.advanceApplied")

  for (const expense of expenses) {
    for (const allocation of expense.allocations) {
      const teacherId = allocation.teacherId.toString()

      if (!advances.has(teacherId)) continue

      const advanceApplied = allocation.advanceApplied || 0

      const credit = expense.isCancelled
        ? allocation.paidAmount + advanceApplied
        : -advanceApplied

      advances.set(
        teacherId,
        roundAmount(advances.get(teacherId) + credit)
      )
    }
  }

  for (const [teacherId, amount] of advances) {
    advances.set(teacherId, roundAmount(Math.max(amount, 0)))
  }

  return advances
}

const getContributionStatus = (allocated, paid, due) => {
  if (allocated === 0 && paid === 0) return "No expenses"
  if (due <= 0) return "Paid"
  if (paid > 0) return "Partial"
  return "Due"
}

const populateExpense = (query) => {
  return query.populate("allocations.teacherId", "name teacherId status")
}

export const createExpense = async (req, res) => {
  try {
    const { category, amount, expenseDate, description } = req.body
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

    const teachers = await Teacher.find({ status: "active" }).select("_id")

    const totalAmount = roundAmount(expenseAmount)
    const teacherCount = teachers.length
    const baseShare = teacherCount
      ? Math.floor((totalAmount / teacherCount) * 100) / 100
      : 0

    const advances = await getAvailableTeacherAdvances(
      teachers.map(teacher => teacher._id)
    )

    let allocatedTotal = 0

    const allocations = teachers.map((teacher, index) => {
      const allocatedAmount = index === teacherCount - 1
        ? roundAmount(totalAmount - allocatedTotal)
        : baseShare

      allocatedTotal = roundAmount(allocatedTotal + allocatedAmount)

      const teacherId = teacher._id.toString()
      const advanceApplied = roundAmount(
        Math.min(allocatedAmount, advances.get(teacherId) || 0)
      )

      return {
        teacherId: teacher._id,
        allocatedAmount,
        paidAmount: 0,
        advanceApplied,
        reversedAmount: 0,
        adjustmentRequired: false,
        payments: []
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
    return res.status(500).json({ message: error.message })
  }
}

export const getExpenses = async (req, res) => {
  try {
    const filter = getExpenseFilter(req.query)

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
    const filter = getExpenseFilter(req.query)
    const expenses = await Expense.find(filter)

    const totalExpenses = roundAmount(
      expenses.reduce((total, expense) => total + expense.amount, 0)
    )

    const totalAllocated = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) => sum + allocation.allocatedAmount,
          0
        )
      }, 0)
    )

    const totalContributionsPaid = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) => sum + allocation.paidAmount,
          0
        )
      }, 0)
    )

    const totalContributionDue = roundAmount(
      expenses.reduce((total, expense) => {
        return total + expense.allocations.reduce(
          (sum, allocation) =>
            sum + getContributionDue(allocation, expense.isCancelled),
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
    return res.status(400).json({ message: error.message })
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
            totalDue: 0,
            adjustmentRequired: false
          })
        }

        const summary = teacherMap.get(teacherId)

        if (!expense.isCancelled) {
          summary.totalAllocated += allocation.allocatedAmount
          summary.totalDue += getContributionDue(allocation, false)
        }

        summary.totalPaid += allocation.paidAmount

        if (allocation.adjustmentRequired) {
          summary.adjustmentRequired = true
        }
      }
    }

    const contributions = Array.from(teacherMap.values()).map(teacher => ({
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
    return res.status(400).json({ message: error.message })
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

      const due = getContributionDue(allocation, expense.isCancelled)

      return {
        expenseId: expense._id,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        description: expense.description,
        allocatedAmount: allocation.allocatedAmount,
        paidAmount: allocation.paidAmount,
        advanceApplied: allocation.advanceApplied || 0,
        dueAmount: due,
        isCancelled: expense.isCancelled,
        adjustmentRequired: allocation.adjustmentRequired,
        status: expense.isCancelled
          ? "Cancelled"
          : getContributionStatus(
              allocation.allocatedAmount,
              allocation.paidAmount,
              due
            ),
        payments: allocation.payments
      }
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
    let adjustmentRequired = false

    const history = expenses.map(expense => {
      const allocation = expense.allocations.find(
        item => item.teacherId.toString() === teacher._id.toString()
      )

      if (!allocation) return null

      const due = getContributionDue(allocation, expense.isCancelled)

      if (!expense.isCancelled) {
        totalAllocated += allocation.allocatedAmount
        totalDue += due
      }

      totalPaid += allocation.paidAmount

      if (allocation.adjustmentRequired) {
        adjustmentRequired = true
      }

      return {
        expenseId: expense._id,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        description: expense.description,
        allocatedAmount: allocation.allocatedAmount,
        paidAmount: allocation.paidAmount,
        advanceApplied: allocation.advanceApplied || 0,
        dueAmount: due,
        isCancelled: expense.isCancelled,
        adjustmentRequired: allocation.adjustmentRequired,
        status: expense.isCancelled
          ? "Cancelled"
          : getContributionStatus(
              allocation.allocatedAmount,
              allocation.paidAmount,
              due
            ),
        payments: allocation.payments
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
        adjustmentRequired,
        status: getContributionStatus(
          totalAllocated,
          totalPaid,
          totalDue
        )
      },
      history
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export const recordTeacherContribution = async (req, res) => {
  try {
    const { expenseId, teacherId } = req.params
    const { amount, paymentDate, paymentMethod, note } = req.body
    const paymentAmount = Number(amount)

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid payment amount" })
    }

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (expense.isCancelled) {
      return res.status(400).json({
        message: "Contributions cannot be recorded for a cancelled expense"
      })
    }

    const allocation = expense.allocations.find(
      item => item.teacherId.toString() === teacherId
    )

    if (!allocation) {
      return res.status(404).json({
        message: "Teacher allocation not found for this expense"
      })
    }

    const due = getContributionDue(allocation, false)

    if (roundAmount(paymentAmount) > due) {
      return res.status(400).json({
        message: `Payment cannot exceed the outstanding amount of ${due.toFixed(2)}`
      })
    }

    const date = paymentDate ? new Date(paymentDate) : new Date()

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid payment date" })
    }

    const method = paymentMethod || "cash"

    if (!["cash", "upi", "bank_transfer", "other"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" })
    }

    allocation.payments.push({
      amount: roundAmount(paymentAmount),
      paymentDate: date,
      paymentMethod: method,
      note: note?.trim() || ""
    })

    allocation.paidAmount = roundAmount(
      allocation.paidAmount + paymentAmount
    )

    await expense.save()

    return res.status(200).json({
      message: "Teacher contribution recorded successfully",
      paidAmount: allocation.paidAmount,
      dueAmount: getContributionDue(allocation, false),
      status: getContributionStatus(
        allocation.allocatedAmount,
        allocation.paidAmount,
        getContributionDue(allocation, false)
      )
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const cancelExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    const { cancelReason } = req.body

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    if (expense.isCancelled) {
      return res.status(400).json({ message: "Expense is already cancelled" })
    }

    for (const allocation of expense.allocations) {
      const unpaidAmount = roundAmount(
        Math.max(
          allocation.allocatedAmount -
          allocation.paidAmount -
          (allocation.advanceApplied || 0) -
          allocation.reversedAmount,
          0
        )
      )

      allocation.reversedAmount = roundAmount(
        allocation.reversedAmount + unpaidAmount
      )

      if (allocation.paidAmount > 0) {
        allocation.adjustmentRequired = true
      }
    }

    expense.isCancelled = true
    expense.cancelledAt = new Date()
    expense.cancelReason = cancelReason?.trim() || ""

    await expense.save()

    return res.status(200).json({
      message: "Expense cancelled. Unpaid allocations were reversed, and paid contributions and applied advances are available as teacher credit.",
      expense
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
