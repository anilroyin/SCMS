import Fee from "../models/fee.js"
import Student from "../models/student.js"
import TeacherEarning from "../models/teacherEarning.js"


const round = (value) => Number(value.toFixed(2))


// -----------------------------------------------------
// FEE REPORT
// -----------------------------------------------------

const getFeeReport = async (req, res) => {
  try {
    const { billingMonth, studentId, subjectId, teacherId } = req.query

    const filter = {}

    if (billingMonth) {
      filter.billingMonth = billingMonth
    }

    if (studentId && studentId !== "all") {
      filter.studentId = studentId
    }

    if (subjectId && subjectId !== "all") {
      filter.subjectId = subjectId
    }

    if (teacherId && teacherId !== "all") {
      filter.teacherId = teacherId
    }

    const fees = await Fee.find(filter)
      .populate(
        "studentId",
        "studentId name className"
      )
      .populate(
        "subjectId",
        "name"
      )
      .populate(
        "teacherId",
        "teacherId name"
      )
      .sort({
        billingMonth: -1,
        createdAt: -1
      })

    const report = fees
      .filter(
        (fee) =>
          fee.studentId &&
          fee.subjectId &&
          fee.teacherId
      )
      .map((fee) => ({
        id: fee._id,
        billingMonth: fee.billingMonth,

        studentId: fee.studentId.studentId,
        studentName: fee.studentId.name,
        className: fee.studentId.className,

        subject: fee.subjectId.name,

        teacherId: fee.teacherId.teacherId,
        teacherName: fee.teacherId.name,

        originalFee: fee.originalFee,
        discount: fee.discount,
        netFee: fee.netFee,

        paidAmount: fee.paidAmount || 0,
        dueAmount:
          fee.dueAmount ?? fee.netFee,

        paymentStatus: fee.paymentStatus
      }))

    res.json({
      count: report.length,
      fees: report
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate fee report",
      error: error.message
    })
  }
}


// -----------------------------------------------------
// TEACHER PAYMENT REPORT
// -----------------------------------------------------

const getTeacherPaymentReport = async (req, res) => {
  try {
    const { billingMonth, teacherId } = req.query

    const filter = {}

    if (billingMonth) {
      filter.billingMonth = billingMonth
    }

    if (teacherId && teacherId !== "all") {
      filter.teacherId = teacherId
    }

    const fees = await Fee.find(filter)
      .populate(
        "teacherId",
        "teacherId name commission"
      )

    const teacherData = {}

    for (const fee of fees) {
      if (!fee.teacherId) {
        continue
      }

      const id = fee.teacherId._id.toString()

      if (!teacherData[id]) {
        teacherData[id] = {
          teacherId: fee.teacherId.teacherId,
          teacherName: fee.teacherId.name,
          commission: fee.teacherId.commission,

          applicableFees: 0,
          collectedAmount: 0,
          centerCommission: 0,
          teacherPayment: 0
        }
      }

      const collectedAmount =
        fee.paidAmount || 0

      const centerCommission =
        (collectedAmount *
          fee.teacherId.commission) /
        100

      const teacherPayment =
        collectedAmount -
        centerCommission

      teacherData[id].applicableFees +=
        fee.netFee

      teacherData[id].collectedAmount +=
        collectedAmount

      teacherData[id].centerCommission +=
        centerCommission

      teacherData[id].teacherPayment +=
        teacherPayment
    }

    const report = Object.values(
      teacherData
    ).map((teacher) => ({
      ...teacher,

      applicableFees: round(
        teacher.applicableFees
      ),

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

    res.json({
      count: report.length,
      teachers: report
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to generate teacher payment report",
      error: error.message
    })
  }
}


// -----------------------------------------------------
// STUDENT REPORT
// -----------------------------------------------------

const getStudentReport = async (req, res) => {
  try {
    const students = await Student.find()

    const totalStudents = students.length

    const activeStudents = students.filter(
      (student) =>
        student.status === "active"
    ).length

    const inactiveStudents =
      students.filter(
        (student) =>
          student.status !== "active"
      ).length

    const classData = {}

    let multiSubjectStudents = 0

    for (const student of students) {
      const className =
        student.className || "Unknown"

      if (!classData[className]) {
        classData[className] = 0
      }

      classData[className]++

      if (
        Array.isArray(student.subjects) &&
        student.subjects.length > 1
      ) {
        multiSubjectStudents++
      }
    }

    const studentsByClass =
      Object.entries(classData).map(
        ([className, count]) => ({
          className,
          count
        })
      )

    res.json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      multiSubjectStudents,
      studentsByClass
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to generate student report",
      error: error.message
    })
  }
}


// -----------------------------------------------------
// FINANCIAL SUMMARY
// -----------------------------------------------------

const getFinancialSummary = async (req, res) => {
  try {
    const { billingMonth } = req.query

    const filter = {}

    if (billingMonth) {
      filter.billingMonth = billingMonth
    }

    const fees = await Fee.find(filter)

    let totalFeeGenerated = 0
    let totalCollection = 0
    let totalOutstanding = 0
    let totalCenterCommission = 0
    let totalTeacherShare = 0

    for (const fee of fees) {
      const netFee = fee.netFee || 0
      const paidAmount = fee.paidAmount || 0
      const dueAmount =
        fee.dueAmount ?? netFee

      const centerCommission =
        (paidAmount *
          (fee.commission || 0)) /
        100

      const teacherShare =
        paidAmount -
        centerCommission

      totalFeeGenerated += netFee
      totalCollection += paidAmount
      totalOutstanding += dueAmount
      totalCenterCommission +=
        centerCommission
      totalTeacherShare += teacherShare
    }

    res.json({
      billingMonth:
        billingMonth || "all",

      totalFeeGenerated:
        round(totalFeeGenerated),

      totalCollection:
        round(totalCollection),

      totalOutstanding:
        round(totalOutstanding),

      totalCenterCommission:
        round(totalCenterCommission),

      totalTeacherShare:
        round(totalTeacherShare)
    })
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to generate financial summary",
      error: error.message
    })
  }
}


export {
  getFeeReport,
  getTeacherPaymentReport,
  getStudentReport,
  getFinancialSummary
}