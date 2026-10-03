import TeacherPayment from "../models/teacherPayment.js"
import TeacherEarning from "../models/teacherEarning.js"
import Teacher from "../models/teacher.js"

const getTeacherPayments = async (req, res) => {
  try {
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const earnings = await TeacherEarning.find({
      billingMonth
    })

    const payments = await TeacherPayment.find({
      billingMonth
    })

    const teacherIds = [
      ...new Set(
        earnings.map((earning) =>
          earning.teacherId.toString()
        )
      )
    ]

    const teachers = await Teacher.find({
      _id: { $in: teacherIds }
    }).select("teacherId name")

    const teacherSummary = {}

    teachers.forEach((teacher) => {
      const teacherId = teacher._id.toString()

      teacherSummary[teacherId] = {
        id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        totalEarned: 0,
        totalPaid: 0,
        payable: 0
      }
    })

    earnings.forEach((earning) => {
      const teacherId =
        earning.teacherId.toString()

      if (!teacherSummary[teacherId]) {
        return
      }

      teacherSummary[teacherId].totalEarned +=
        earning.teacherEarned
    })

    payments.forEach((payment) => {
      const teacherId =
        payment.teacherId.toString()

      if (!teacherSummary[teacherId]) {
        return
      }

      teacherSummary[teacherId].totalPaid +=
        payment.amount
    })

    const result = Object.values(
      teacherSummary
    ).map((teacher) => {
      teacher.totalEarned = Number(
        teacher.totalEarned.toFixed(2)
      )

      teacher.totalPaid = Number(
        teacher.totalPaid.toFixed(2)
      )

      teacher.payable = Number(
        (
          teacher.totalEarned -
          teacher.totalPaid
        ).toFixed(2)
      )

      return teacher
    })

    const totalCollected = earnings.reduce(
      (total, earning) => {
        return total + earning.collectedAmount
      },
      0
    )

    const totalTeacherEarned = earnings.reduce(
      (total, earning) => {
        return total + earning.teacherEarned
      },
      0
    )

    const totalCenterEarned =
      totalCollected - totalTeacherEarned

    const totalPaid = result.reduce(
      (total, teacher) => {
        return total + teacher.totalPaid
      },
      0
    )

    const totalPayable = result.reduce(
      (total, teacher) => {
        return total + teacher.payable
      },
      0
    )

    res.json({
      billingMonth,
      teachers: result,
      summary: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        totalTeacherEarned: Number(
          totalTeacherEarned.toFixed(2)
        ),
        totalCenterEarned: Number(
          totalCenterEarned.toFixed(2)
        ),
        totalPaid: Number(
          totalPaid.toFixed(2)
        ),
        totalPayable: Number(
          totalPayable.toFixed(2)
        )
      }
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to get teacher payments",
      error: error.message
    })
  }
}

const getTeacherPaymentDetails = async (
  req,
  res
) => {
  try {
    const { teacherId } = req.params
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const teacher = await Teacher.findById(
      teacherId
    ).select("teacherId name")

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const earnings = await TeacherEarning.find({
      teacherId,
      billingMonth
    })
      .populate(
        "studentId",
        "studentId name"
      )
      .populate(
        "subjectId",
        "name"
      )
      .sort({ createdAt: 1 })

    const payments = await TeacherPayment.find({
      teacherId,
      billingMonth
    }).sort({ paymentDate: -1 })

    const totalCollected = earnings.reduce(
      (total, earning) => {
        return total + earning.collectedAmount
      },
      0
    )

    const totalEarned = earnings.reduce(
      (total, earning) => {
        return total + earning.teacherEarned
      },
      0
    )

    const totalCenterEarned =
      totalCollected - totalEarned

    const totalPaid = payments.reduce(
      (total, payment) => {
        return total + payment.amount
      },
      0
    )

    const payable = totalEarned - totalPaid

    res.json({
      billingMonth,

      teacher: {
        id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name
      },

      earnings: earnings.map((earning) => ({
        id: earning._id,
        studentId:
          earning.studentId?.studentId,
        student:
          earning.studentId?.name,
        subject:
          earning.subjectId?.name,
        commission:
          earning.commission,
        collectedAmount:
          earning.collectedAmount,
        teacherEarned:
          earning.teacherEarned,
        centerEarned: Number(
          (
            earning.collectedAmount -
            earning.teacherEarned
          ).toFixed(2)
        ),
        createdAt:
          earning.createdAt
      })),

      payments: payments.map((payment) => ({
        id: payment._id,
        amount: payment.amount,
        paymentDate:
          payment.paymentDate,
        paymentMethod:
          payment.paymentMethod,
        note: payment.note
      })),

      totals: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        totalEarned: Number(
          totalEarned.toFixed(2)
        ),
        totalCenterEarned: Number(
          totalCenterEarned.toFixed(2)
        ),
        totalPaid: Number(
          totalPaid.toFixed(2)
        ),
        payable: Number(
          payable.toFixed(2)
        )
      }
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to get teacher payment details",
      error: error.message
    })
  }
}

const recordTeacherPayment = async (
  req,
  res
) => {
  try {
    const { teacherId } = req.params
    const {
      billingMonth,
      amount,
      paymentMethod,
      note
    } = req.body

    const paymentAmount = Number(amount)

    if (
      !billingMonth ||
      !paymentAmount ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid billing month and payment amount are required"
      })
    }

    const teacher = await Teacher.findById(
      teacherId
    )

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      })
    }

    const earnings = await TeacherEarning.find({
      teacherId,
      billingMonth
    })

    const payments = await TeacherPayment.find({
      teacherId,
      billingMonth
    })

    const totalEarned = earnings.reduce(
      (total, earning) => {
        return total + earning.teacherEarned
      },
      0
    )

    const totalPaid = payments.reduce(
      (total, payment) => {
        return total + payment.amount
      },
      0
    )

    const payable = totalEarned - totalPaid

    if (paymentAmount > payable) {
      return res.status(400).json({
        message:
          `Payment cannot be more than the payable amount of ₹${payable.toFixed(2)}`
      })
    }

    const payment =
      await TeacherPayment.create({
        teacherId,
        billingMonth,
        amount: paymentAmount,
        paymentDate: new Date(),
        paymentMethod:
          paymentMethod || "cash",
        note: note || ""
      })

    res.status(201).json({
      message:
        "Teacher payment recorded successfully",
      payment: {
        id: payment._id,
        amount: payment.amount,
        paymentDate:
          payment.paymentDate
      }
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to record teacher payment",
      error: error.message
    })
  }
}

export {
  getTeacherPayments,
  getTeacherPaymentDetails,
  recordTeacherPayment
}