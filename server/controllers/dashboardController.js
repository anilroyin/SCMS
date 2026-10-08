import Fee from "../models/fee.js"
import Student from "../models/student.js"
import Teacher from "../models/teacher.js"
import Notification from "../models/notification.js"
import Schedule from "../models/schedule.js"

const round = (value) => Number(value.toFixed(2))

const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const billingMonth = `${year}-${month}`

    const startOfMonth = new Date(year, now.getMonth(), 1)
    const startOfNextMonth = new Date(year, now.getMonth() + 1, 1)

    const today = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata"
    }).format(now)

    const currentTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    }).format(now)

    const birthdayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    })

    const todayParts = birthdayFormatter.formatToParts(now)

    const currentYear = Number(
      todayParts.find(
        part => part.type === "year"
      ).value
    )

    const currentMonth = Number(
      todayParts.find(
        part => part.type === "month"
      ).value
    )

    const currentDay = Number(
      todayParts.find(
        part => part.type === "day"
      ).value
    )

    const todayNumber = Date.UTC(
      currentYear,
      currentMonth - 1,
      currentDay
    )

    const [
      students,
      teachers,
      monthlyFees,
      recentPayments,
      notifications,
      schedules
    ] = await Promise.all([
      Student.find().select(
        "name status dateOfBirth"
      ),
      Teacher.find().select(
        "name teacherId commission dateOfBirth"
      ),
      Fee.find({ billingMonth }).populate(
        "studentId",
        "studentId name"
      ),
      Fee.find({
        payments: {
          $exists: true,
          $not: { $size: 0 }
        }
      })
        .populate("studentId", "studentId name")
        .populate("subjectId", "name")
        .sort({ updatedAt: -1 })
        .limit(10),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("sender", "name role"),
      Schedule.find({
        day: today,
        status: "active"
      })
        .populate("subjectId", "name")
        .populate(
          "teacherId",
          "teacherId name"
        )
        .sort({ startTime: 1 })
    ])

    const upcomingBirthdays = []

    const addBirthday = (person, type) => {
      if (!person.dateOfBirth) {
        return
      }

      const dob = new Date(person.dateOfBirth)

      let birthday = Date.UTC(
        currentYear,
        dob.getUTCMonth(),
        dob.getUTCDate()
      )

      if (birthday < todayNumber) {
        birthday = Date.UTC(
          currentYear + 1,
          dob.getUTCMonth(),
          dob.getUTCDate()
        )
      }

      const daysUntil = Math.round(
        (birthday - todayNumber) / 86400000
      )

      if (daysUntil <= 7) {
        upcomingBirthdays.push({
          id: person._id.toString(),
          name: person.name,
          type,
          dateOfBirth: person.dateOfBirth,
          daysUntil,
          isToday: daysUntil === 0
        })
      }
    }

    students.forEach(student =>
      addBirthday(student, "student")
    )

    teachers.forEach(teacher =>
      addBirthday(teacher, "teacher")
    )

    upcomingBirthdays.sort(
      (a, b) => a.daysUntil - b.daysUntil
    )

    const totalStudents = students.length

    const activeStudents = students.filter(
      student => student.status === "active"
    ).length

    const studentChurn = students.filter(
      student =>
        student.status === "paused" ||
        student.status === "left"
    ).length

    let thisMonthCollection = 0
    let outstandingFees = 0

    const feeStatus = {
      paid: 0,
      partial: 0,
      due: 0
    }

    const weeklyCollection = {
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0
    }

    const studentFeeStatus = {}

    for (const fee of monthlyFees) {
      const paidAmount = fee.paidAmount || 0
      const dueAmount =
        fee.dueAmount ?? fee.netFee

      thisMonthCollection += paidAmount
      outstandingFees += dueAmount

      const studentId =
        fee.studentId?._id?.toString()

      if (studentId) {
        if (!studentFeeStatus[studentId]) {
          studentFeeStatus[studentId] = {
            paid: 0,
            due: 0
          }
        }

        studentFeeStatus[studentId].paid +=
          paidAmount

        studentFeeStatus[studentId].due +=
          dueAmount
      }

      for (const payment of fee.payments || []) {
        const paymentDate = new Date(
          payment.paymentDate
        )

        if (
          paymentDate >= startOfMonth &&
          paymentDate < startOfNextMonth
        ) {
          const day = paymentDate.getDate()
          const amount =
            Number(payment.amount) || 0

          if (day <= 7) {
            weeklyCollection.week1 += amount
          } else if (day <= 14) {
            weeklyCollection.week2 += amount
          } else if (day <= 21) {
            weeklyCollection.week3 += amount
          } else {
            weeklyCollection.week4 += amount
          }
        }
      }
    }

    for (const student of Object.values(
      studentFeeStatus
    )) {
      if (student.due === 0) {
        feeStatus.paid++
      } else if (student.paid > 0) {
        feeStatus.partial++
      } else {
        feeStatus.due++
      }
    }

    const payments = []

    for (const fee of recentPayments) {
      for (const payment of fee.payments || []) {
        payments.push({
          id: payment._id,
          amount: payment.amount,
          paymentMethod:
            payment.paymentMethod,
          paymentDate: payment.paymentDate,
          studentName:
            fee.studentId?.name || "Unknown",
          studentId:
            fee.studentId?.studentId || "",
          subject:
            fee.subjectId?.name || ""
        })
      }
    }

    payments.sort(
      (a, b) =>
        new Date(b.paymentDate) -
        new Date(a.paymentDate)
    )

    const recentPaymentList =
      payments.slice(0, 10)

    const teacherPaymentData = {}

    for (const fee of monthlyFees) {
      const teacherId =
        fee.teacherId?.toString()

      if (!teacherId) {
        continue
      }

      const teacher = teachers.find(
        item =>
          item._id.toString() === teacherId
      )

      if (!teacher) {
        continue
      }

      if (!teacherPaymentData[teacherId]) {
        teacherPaymentData[teacherId] = {
          teacherId: teacher.teacherId,
          teacherName: teacher.name,
          commission: teacher.commission,
          collectedAmount: 0,
          centerCommission: 0,
          teacherPayment: 0
        }
      }

      const paidAmount =
        fee.paidAmount || 0

      const centerCommission =
        (paidAmount * teacher.commission) / 100

      teacherPaymentData[
        teacherId
      ].collectedAmount += paidAmount

      teacherPaymentData[
        teacherId
      ].centerCommission +=
        centerCommission

      teacherPaymentData[
        teacherId
      ].teacherPayment +=
        paidAmount - centerCommission
    }

    const teacherPayments = Object.values(
      teacherPaymentData
    ).map(teacher => ({
      ...teacher,
      collectedAmount: round(
        teacher.collectedAmount
      ),
      centerCommission: round(
        teacher.centerCommission
      ),
      teacherPayment: round(
        teacher.teacherPayment
      )
    }))

    const upcomingClasses = schedules
      .filter(
        schedule =>
          schedule.startTime >= currentTime
      )
      .slice(0, 5)

    res.json({
      billingMonth,
      summary: {
        totalStudents,
        activeStudents,
        studentChurn,
        totalTeachers: teachers.length,
        thisMonthCollection:
          round(thisMonthCollection),
        outstandingFees:
          round(outstandingFees)
      },
      feeCollection: Object.entries(
        weeklyCollection
      ).map(([week, amount]) => ({
        week,
        amount: round(amount)
      })),
      feeStatus,
      recentPayments: recentPaymentList,
      teacherPayments,
      upcomingClasses,
      upcomingBirthdays,
      recentNotifications: notifications
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load admin dashboard",
      error: error.message
    })
  }
}

export {
  getAdminDashboard
}