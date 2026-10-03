import TeacherEarning from "../models/teacherEarning.js"
import Teacher from "../models/teacher.js"

const getTeacherEarnings = async (req, res) => {
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
      .populate(
        "teacherId",
        "teacherId name"
      )
      .populate(
        "studentId",
        "studentId name"
      )
      .populate(
        "subjectId",
        "name"
      )
      .sort({ createdAt: 1 })

    const teacherEarnings = {}

    for (const earning of earnings) {
      if (!earning.teacherId) {
        continue
      }

      const teacherId =
        earning.teacherId._id.toString()

      if (!teacherEarnings[teacherId]) {
        teacherEarnings[teacherId] = {
          id: earning.teacherId._id,
          teacherId: earning.teacherId.teacherId,
          name: earning.teacherId.name,
          collectedAmount: 0,
          teacherEarned: 0
        }
      }

      teacherEarnings[teacherId].collectedAmount +=
        earning.collectedAmount

      teacherEarnings[teacherId].teacherEarned +=
        earning.teacherEarned
    }

    const teachers = Object.values(
      teacherEarnings
    ).map((teacher) => {
      return {
        ...teacher,
        collectedAmount: Number(
          teacher.collectedAmount.toFixed(2)
        ),
        teacherEarned: Number(
          teacher.teacherEarned.toFixed(2)
        )
      }
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

    res.json({
      billingMonth,
      teachers,
      summary: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        totalTeacherEarned: Number(
          totalTeacherEarned.toFixed(2)
        )
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get teacher earnings",
      error: error.message
    })
  }
}

const getMyTeacherEarnings = async (req, res) => {
  try {
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
      })
    }

    const teacher = await Teacher.findOne({
      userId: req.user.userId
    })

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found"
      })
    }

    const earnings = await TeacherEarning.find({
      teacherId: teacher._id,
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

    let totalCollected = 0
    let totalTeacherEarned = 0

    const records = earnings.map((earning) => {
      totalCollected += earning.collectedAmount
      totalTeacherEarned += earning.teacherEarned

      return {
        id: earning._id,
        student: earning.studentId?.name,
        studentId: earning.studentId?.studentId,
        subject: earning.subjectId?.name,
        commission: earning.commission,
        collectedAmount: earning.collectedAmount,
        teacherEarned: earning.teacherEarned
      }
    })

    const commissionCut =
      totalCollected - totalTeacherEarned

    res.json({
      billingMonth,
      records,
      summary: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        teacherEarned: Number(
          totalTeacherEarned.toFixed(2)
        ),
        commissionCut: Number(
          commissionCut.toFixed(2)
        )
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get your earnings",
      error: error.message
    })
  }
}

const getTeacherEarningDetails = async (req, res) => {
  try {
    const { teacherId } = req.params
    const { billingMonth } = req.query

    if (!billingMonth) {
      return res.status(400).json({
        message: "Billing month is required"
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

    let totalCollected = 0
    let totalEarned = 0

    const records = earnings.map((earning) => {
      totalCollected += earning.collectedAmount
      totalEarned += earning.teacherEarned

      return {
        id: earning._id,
        student: earning.studentId?.name,
        studentId: earning.studentId?.studentId,
        subject: earning.subjectId?.name,
        commission: earning.commission,
        collectedAmount: earning.collectedAmount,
        teacherEarned: earning.teacherEarned,
        createdAt: earning.createdAt
      }
    })

    res.json({
      billingMonth,
      records,
      totals: {
        totalCollected: Number(
          totalCollected.toFixed(2)
        ),
        totalEarned: Number(
          totalEarned.toFixed(2)
        )
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to get teacher earning details",
      error: error.message
    })
  }
}

export {
  getTeacherEarnings,
  getMyTeacherEarnings,
  getTeacherEarningDetails
}