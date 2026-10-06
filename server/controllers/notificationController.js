import Notification from "../models/notification.js"
import User from "../models/user.js"
import Student from "../models/student.js"
import Teacher from "../models/teacher.js"
import Fee from "../models/fee.js"

const getUniqueUserIds = (users) => {
  return [...new Set(users.map((user) => user.userId?.toString()).filter(Boolean))]
}

const getStudentUserIds = async (studentIds) => {
  const students = await Student.find({
    _id: { $in: studentIds }
  }).select("userId")

  return getUniqueUserIds(students)
}

const createNotification = async (req, res) => {
  try {
    const {
      targetType,
      className,
      studentId,
      teacherId,
      billingMonth,
      title,
      message
    } = req.body

    if (!targetType || !title || !message) {
      return res.status(400).json({
        message: "Target, title and message are required"
      })
    }

    let recipientUserIds = []

    if (req.user.role === "admin") {
      if (
        ![
          "everyone",
          "all_students",
          "all_teachers",
          "fee_due",
          "fee_partial",
          "individual_student",
          "individual_teacher"
        ].includes(targetType)
      ) {
        return res.status(403).json({
          message: "Invalid notification target for admin"
        })
      }

      if (targetType === "everyone") {
        const users = await User.find({
          role: { $in: ["admin", "teacher", "student"] }
        }).select("_id")

        recipientUserIds = users.map((user) => user._id.toString())
      }

      if (targetType === "all_students") {
        const users = await User.find({
          role: "student"
        }).select("_id")

        recipientUserIds = users.map((user) => user._id.toString())
      }

      if (targetType === "all_teachers") {
        const users = await User.find({
          role: "teacher"
        }).select("_id")

        recipientUserIds = users.map((user) => user._id.toString())
      }

      if (targetType === "fee_due" || targetType === "fee_partial") {
        if (!billingMonth) {
          return res.status(400).json({
            message: "Billing month is required for fee notifications"
          })
        }

        const paymentStatus =
          targetType === "fee_due" ? "due" : "partial"

        const fees = await Fee.find({
          billingMonth,
          paymentStatus
        }).select("studentId")

        const studentIds = [
          ...new Set(
            fees.map((fee) => fee.studentId.toString())
          )
        ]

        recipientUserIds = await getStudentUserIds(studentIds)
      }

      if (targetType === "individual_student") {
        if (!studentId) {
          return res.status(400).json({
            message: "Student ID is required"
          })
        }

        const student = await Student.findById(studentId).select("userId")

        if (!student) {
          return res.status(404).json({
            message: "Student not found"
          })
        }

        recipientUserIds = [student.userId.toString()]
      }

      if (targetType === "individual_teacher") {
        if (!teacherId) {
          return res.status(400).json({
            message: "Teacher ID is required"
          })
        }

        const teacher = await Teacher.findById(teacherId).select("userId")

        if (!teacher) {
          return res.status(404).json({
            message: "Teacher not found"
          })
        }

        recipientUserIds = [teacher.userId.toString()]
      }
    }

    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({
        userId: req.user.userId
      })

      if (!teacher) {
        return res.status(404).json({
          message: "Teacher profile not found"
        })
      }

      if (
        ![
          "teacher_students",
          "teacher_class",
          "teacher_individual_student"
        ].includes(targetType)
      ) {
        return res.status(403).json({
          message: "Invalid notification target for teacher"
        })
      }

      if (targetType === "teacher_students") {
        const students = await Student.find({
          "subjects.teacherId": teacher._id
        }).select("userId")

        recipientUserIds = getUniqueUserIds(students)
      }

      if (targetType === "teacher_class") {
        if (!className) {
          return res.status(400).json({
            message: "Class is required"
          })
        }

        const students = await Student.find({
          className,
          "subjects.teacherId": teacher._id
        }).select("userId")

        recipientUserIds = getUniqueUserIds(students)
      }

      if (targetType === "teacher_individual_student") {
        if (!studentId) {
          return res.status(400).json({
            message: "Student ID is required"
          })
        }

        const student = await Student.findOne({
          _id: studentId,
          "subjects.teacherId": teacher._id
        }).select("userId")

        if (!student) {
          return res.status(403).json({
            message: "You can only send notifications to your students"
          })
        }

        recipientUserIds = [student.userId.toString()]
      }
    }

    recipientUserIds = [...new Set(recipientUserIds)]

    if (recipientUserIds.length === 0) {
      return res.status(400).json({
        message: "No recipients found"
      })
    }

    const notification = await Notification.create({
      sender: req.user.userId,
      senderRole: req.user.role,
      targetType,
      className: className || undefined,
      recipients: recipientUserIds,
      title,
      message
    })

    res.status(201).json({
      message: "Notification sent successfully",
      notification
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to send notification",
      error: error.message
    })
  }
}

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipients: req.user.userId
    })
      .populate("sender", "name email role")
      .sort({ createdAt: -1 })

    const result = notifications.map((notification) => ({
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      targetType: notification.targetType,
      sender: notification.sender,
      createdAt: notification.createdAt,
      isRead: notification.readBy.some(
        (userId) => userId.toString() === req.user.userId
      )
    }))

    res.json(result)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notifications",
      error: error.message
    })
  }
}

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipients: req.user.userId
    })

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      })
    }

    const alreadyRead = notification.readBy.some(
      (userId) => userId.toString() === req.user.userId
    )

    if (!alreadyRead) {
      notification.readBy.push(req.user.userId)
      await notification.save()
    }

    res.json({
      message: "Notification marked as read"
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message
    })
  }
}

const markAdminNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    )

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      })
    }

    notification.adminRead = true
    await notification.save()

    res.json({
      message: "Notification marked as read"
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark admin notification as read",
      error: error.message
    })
  }
}

const getNotificationLogs = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("sender", "name email role")
      .populate("recipients", "name email role")
      .sort({ createdAt: -1 })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notification logs",
      error: error.message
    })
  }
}

export {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAdminNotificationAsRead,
  getNotificationLogs
}