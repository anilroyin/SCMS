import Fee from "../models/fee.js"
import Student from "../models/student.js"
import Teacher from "../models/teacher.js"
import TeacherEarning from "../models/teacherEarning.js"

const round = (value) => Number(value.toFixed(2))

const getPaymentStatus = (paidAmount, dueAmount) => {
  if (dueAmount === 0) return "paid"
  if (paidAmount > 0) return "partial"
  return "due"
}

const generateFees = async (req, res) => {
  try {
    const { billingMonth } = req.body

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const students = await Student.find({
      status: "active"
    })

    let generatedCount = 0

    for (const student of students) {
      for (const enrollment of student.subjects) {
        const startedMonth = enrollment.startedAt
          .toISOString()
          .slice(0, 7)

        if (startedMonth > billingMonth) {
          continue
        }

        const teacher = await Teacher.findById(
          enrollment.teacherId
        )

        if (!teacher) {
          continue
        }

        const existingFee = await Fee.findOne({
          studentId: student._id,
          subjectId: enrollment.subjectId,
          billingMonth
        })

        if (existingFee) {
          continue
        }

        const originalFee = enrollment.fee
        const discount = student.discount || 0
        const commission = teacher.commission

        const netFee = round(
          originalFee - (originalFee * discount) / 100
        )

        const centerShare = round(
          (netFee * commission) / 100
        )

        const teacherShare = round(
          netFee - centerShare
        )

        await Fee.create({
          studentId: student._id,
          subjectId: enrollment.subjectId,
          teacherId: enrollment.teacherId,
          billingMonth,
          originalFee,
          discount,
          netFee,
          commission,
          centerShare,
          teacherShare,
          paidAmount: 0,
          dueAmount: netFee,
          paymentStatus: "due",
          payments: []
        })

        generatedCount++
      }
    }

    res.status(201).json({
      message: "Fees generated successfully",
      generatedCount
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate fees",
      error: error.message
    })
  }
}

const getFees = async (req, res) => {
  try {
    const { billingMonth, teacherId } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const feeFilter = {
      billingMonth
    }

    if (teacherId && teacherId !== "all") {
      feeFilter.teacherId = teacherId
    }

    const fees = await Fee.find(feeFilter)
      .populate(
        "studentId",
        "studentId name className school"
      )
      .populate("subjectId", "name")
      .populate("teacherId", "teacherId name")
      .sort({ createdAt: -1 })

    const studentFees = {}

    for (const fee of fees) {
      if (!fee.studentId) {
        continue
      }

      const studentId = fee.studentId._id.toString()

      if (!studentFees[studentId]) {
        studentFees[studentId] = {
          id: fee.studentId._id,
          studentId: fee.studentId.studentId,
          name: fee.studentId.name,
          className: fee.studentId.className,
          school: fee.studentId.school,
          totalSubjects: 0,
          originalFee: 0,
          discount: fee.discount,
          netFee: 0,
          paidAmount: 0,
          dueAmount: 0
        }
      }

      studentFees[studentId].totalSubjects += 1
      studentFees[studentId].originalFee += fee.originalFee
      studentFees[studentId].netFee += fee.netFee
      studentFees[studentId].paidAmount +=
        fee.paidAmount || 0
      studentFees[studentId].dueAmount +=
        fee.dueAmount ?? fee.netFee
    }

    const students = Object.values(studentFees).map(
      (student) => {
        return {
          ...student,
          originalFee: round(student.originalFee),
          netFee: round(student.netFee),
          paidAmount: round(student.paidAmount),
          dueAmount: round(student.dueAmount),
          paymentStatus: getPaymentStatus(
            student.paidAmount,
            student.dueAmount
          )
        }
      }
    )

    res.json({
      billingMonth,
      teacherId: teacherId || "all",
      students
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get fees",
      error: error.message
    })
  }
}

const getFeeSummary = async (req, res) => {
  try {
    const { billingMonth, teacherId } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const feeFilter = {
      billingMonth
    }

    if (teacherId && teacherId !== "all") {
      feeFilter.teacherId = teacherId
    }

    const fees = await Fee.find(feeFilter)

    const studentSummary = {}

    let totalOriginalFee = 0
    let totalNetFee = 0
    let totalCollection = 0
    let totalDue = 0

    for (const fee of fees) {
      totalOriginalFee += fee.originalFee
      totalNetFee += fee.netFee
      totalCollection += fee.paidAmount || 0
      totalDue += fee.dueAmount ?? fee.netFee

      const studentId = fee.studentId.toString()

      if (!studentSummary[studentId]) {
        studentSummary[studentId] = {
          dueAmount: 0
        }
      }

      studentSummary[studentId].dueAmount +=
        fee.dueAmount ?? fee.netFee
    }

    let paidStudents = 0
    let dueStudents = 0

    Object.values(studentSummary).forEach((student) => {
      if (student.dueAmount === 0) {
        paidStudents++
      } else {
        dueStudents++
      }
    })

    res.json({
      billingMonth,
      teacherId: teacherId || "all",
      feeCount: fees.length,
      paidStudents,
      dueStudents,
      summary: {
        totalOriginalFee: round(totalOriginalFee),
        totalNetFee: round(totalNetFee),
        totalCollection: round(totalCollection),
        totalDue: round(totalDue)
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get fee summary",
      error: error.message
    })
  }
}

const buildStudentFeeData = async (
  studentId,
  billingMonth
) => {
  const fees = await Fee.find({
    studentId,
    billingMonth
  })
    .populate(
      "studentId",
      "studentId name className school"
    )
    .populate("subjectId", "name")
    .populate("teacherId", "teacherId name")
    .sort({ createdAt: 1 })

  if (fees.length === 0) {
    return null
  }

  const student = fees[0].studentId

  if (!student) {
    return null
  }

  let totalOriginalFee = 0
  let totalNetFee = 0
  let totalPaid = 0
  let totalDue = 0

  const subjects = fees.map((fee) => {
    const paidAmount = fee.paidAmount || 0
    const dueAmount = fee.dueAmount ?? fee.netFee

    totalOriginalFee += fee.originalFee
    totalNetFee += fee.netFee
    totalPaid += paidAmount
    totalDue += dueAmount

    return {
      id: fee._id,
      subject: fee.subjectId?.name,
      teacher: fee.teacherId?.name,
      originalFee: fee.originalFee,
      discount: fee.discount,
      netFee: fee.netFee,
      paidAmount,
      dueAmount,
      paymentStatus: fee.paymentStatus,
      paymentDate: fee.paymentDate,
      payments: fee.payments || []
    }
  })

  const paymentStatus = getPaymentStatus(
    totalPaid,
    totalDue
  )

  return {
    billingMonth,
    student: {
      id: student._id,
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      school: student.school
    },
    discount: fees[0].discount,
    subjects,
    totals: {
      totalOriginalFee: round(totalOriginalFee),
      totalNetFee: round(totalNetFee),
      totalPaid: round(totalPaid),
      totalDue: round(totalDue),
      paymentStatus
    }
  }
}

const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const data = await buildStudentFeeData(
      studentId,
      billingMonth
    )

    if (!data) {
      return res.status(404).json({
        message: "No fee records found"
      })
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get student fees",
      error: error.message
    })
  }
}

const getMyStudentFees = async (req, res) => {
  try {
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const student = await Student.findOne({
      userId: req.user.userId
    })

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found"
      })
    }

    const data = await buildStudentFeeData(
      student._id,
      billingMonth
    )

    if (!data) {
      return res.status(404).json({
        message: "No fee records found"
      })
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get my fees",
      error: error.message
    })
  }
}

const recordPayment = async (req, res) => {
  try {
    const { studentId } = req.params
    const {
      billingMonth,
      amount,
      paymentMethod
    } = req.body

    const paymentAmount = Number(amount)

    if (
      !billingMonth ||
      !paymentAmount ||
      paymentAmount <= 0 ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message:
          "Valid billing month, payment amount and payment method are required"
      })
    }

    const fees = await Fee.find({
      studentId,
      billingMonth
    }).sort({ createdAt: 1 })

    if (fees.length === 0) {
      return res.status(404).json({
        message: "No fee records found"
      })
    }

    const totalDue = fees.reduce((total, fee) => {
      return total + (fee.dueAmount ?? fee.netFee)
    }, 0)

    if (paymentAmount > totalDue) {
      return res.status(400).json({
        message:
          `Payment cannot be more than the due amount of ₹${totalDue.toFixed(2)}`
      })
    }

    let remainingPayment = paymentAmount

    for (const fee of fees) {
      if (remainingPayment <= 0) {
        break
      }

      const currentDue =
        fee.dueAmount ?? fee.netFee

      if (currentDue <= 0) {
        continue
      }

      const amountForThisFee = Math.min(
        remainingPayment,
        currentDue
      )

      fee.paidAmount = round(
        (fee.paidAmount || 0) + amountForThisFee
      )

      fee.dueAmount = round(
        currentDue - amountForThisFee
      )

      fee.paymentDate = new Date()

      fee.payments.push({
        amount: amountForThisFee,
        paymentDate: fee.paymentDate,
        paymentMethod
      })

      fee.paymentStatus = getPaymentStatus(
        fee.paidAmount,
        fee.dueAmount
      )

      await fee.save()

      const teacher = await Teacher.findById(
        fee.teacherId
      )

      if (teacher) {
        const teacherPercentage =
          100 - teacher.commission

        const teacherEarned = round(
          (amountForThisFee * teacherPercentage) / 100
        )

        if (teacherEarned > 0) {
          await TeacherEarning.create({
            teacherId: fee.teacherId,
            studentId: fee.studentId,
            subjectId: fee.subjectId,
            feeId: fee._id,
            billingMonth: fee.billingMonth,
            commission: teacher.commission,
            collectedAmount: amountForThisFee,
            teacherEarned
          })
        }
      }

      remainingPayment = round(
        remainingPayment - amountForThisFee
      )
    }

    res.json({
      message: "Payment recorded successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to record payment",
      error: error.message
    })
  }
}

export {
  generateFees,
  getFees,
  getFeeSummary,
  getStudentFees,
  getMyStudentFees,
  recordPayment
}