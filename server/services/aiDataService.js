import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Fee from "../models/fee.js";
import TeacherEarning from "../models/teacherEarning.js";
import TeacherPayment from "../models/teacherPayment.js";
import Schedule from "../models/schedule.js";
import Notification from "../models/notification.js";
import Expense from "../models/expense.js";
import Subject from "../models/subject.js";

// Date helpers

const getCurrentBillingMonth = () => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
};

const getRecentBillingMonths = (count = 6) => {
  const currentMonth = getCurrentBillingMonth();
  const [year, month] = currentMonth.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));

    const resultYear = date.getUTCFullYear();
    const resultMonth = String(date.getUTCMonth() + 1).padStart(2, "0");

    return `${resultYear}-${resultMonth}`;
  });
};

const getTodayInIndia = () => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long"
  }).format(new Date());
};

// Public information of coaching

export const getPublicCoachingContext = async () => {
  const [teachers, subjects] = await Promise.all([
    Teacher.find({ status: "active" })
      .select("name subjects")
      .populate("subjects", "name status")
      .lean(),

    Subject.find({ status: "active" })
      .select("name")
      .sort({ name: 1 })
      .lean()
  ]);

  return {
    coachingName: "Siksham",

    availableSubjects: subjects.map((subject) => subject.name),

    teachers: teachers.map((teacher) => ({
      name: teacher.name,
      subjects: (teacher.subjects || [])
        .filter(
          (subject) => subject && subject.status === "active"
        )
        .map((subject) => subject.name)
    }))
  };
};

// Admin AI context

export const getAdminAIContext = async () => {
  const months = getRecentBillingMonths();
  const currentMonth = months[0];

  const [
    publicCoachingInfo,
    totalStudents,
    activeStudents,
    inactiveStudents,
    studentDirectoryRecords,
    totalTeachers,
    activeTeachers,
    teacherDirectoryRecords,
    feeSummary,
    earningSummary,
    teacherWiseEarningRecords,
    paymentSummary,
    teacherWisePaymentRecords,
    expenseRecords,
    recentDueFees,
    currentMonthFeeRecords,
    schedules,
    notificationRecords
  ] = await Promise.all([
    // Public coaching information
    getPublicCoachingContext(),

    // Student statistics
    Student.countDocuments(),
    Student.countDocuments({ status: "active" }),
    Student.countDocuments({
      status: { $in: ["paused", "left"] }
    }),

    // Complete student directory with authoritative subject enrollment
    Student.find()
      .select(
        "studentId name className board school status admissionDate subjects"
      )
      .populate("subjects.subjectId", "name")
      .populate("subjects.teacherId", "name teacherId")
      .sort({ studentId: 1 })
      .lean(),

    // Teacher statistics
    Teacher.countDocuments(),
    Teacher.countDocuments({ status: "active" }),

    // Complete teacher directory
    Teacher.find()
      .select("teacherId name commission status")
      .sort({ teacherId: 1 })
      .lean(),

// Monthly fee summary

Fee.aggregate([
  {
    $match: {
      billingMonth: { $in: months }
    }
  },
  {
    $group: {
      _id: "$billingMonth",
      originalFee: {
        $sum: "$originalFee"
      },
      totalDiscountAmount: {
        $sum: {
          $subtract: [
            "$originalFee",
            "$netFee"
          ]
        }
      },
      netFee: {
        $sum: "$netFee"
      },
      collected: {
        $sum: "$paidAmount"
      },
      outstanding: {
        $sum: "$dueAmount"
      },
      totalFeeRecords: {
        $sum: 1
      }
    }
  },
  {
    $sort: { _id: -1 }
  }
]),

// Overall monthly teacher earning summary

TeacherEarning.aggregate([
  {
    $match: {
      billingMonth: { $in: months }
    }
  },
  {
    $group: {
      _id: "$billingMonth",
      totalCollected: {
        $sum: "$collectedAmount"
      },
      totalTeacherEarned: {
        $sum: "$teacherEarned"
      },
      totalCenterCommission: {
        $sum: {
          $subtract: [
            "$collectedAmount",
            "$teacherEarned"
          ]
        }
      },
      totalEarningRecords: {
        $sum: 1
      }
    }
  },
  {
    $sort: { _id: -1 }
  }
]),

    // Individual teacher-wise earnings
    TeacherEarning.aggregate([
      {
        $match: {
          billingMonth: { $in: months }
        }
      },
      {
        $group: {
          _id: {
            teacherId: "$teacherId",
            billingMonth: "$billingMonth"
          },

          totalCollected: {
            $sum: "$collectedAmount"
          },

          totalTeacherEarned: {
            $sum: "$teacherEarned"
          },

          totalCenterCommission: {
            $sum: {
              $subtract: [
                "$collectedAmount",
                "$teacherEarned"
              ]
            }
          },

          commissionRates: {
            $addToSet: "$commission"
          },

          earningRecordCount: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.billingMonth": -1
        }
      }
    ]),

    // Overall monthly teacher payment summary
    TeacherPayment.aggregate([
      {
        $match: {
          billingMonth: { $in: months }
        }
      },
      {
        $group: {
          _id: "$billingMonth",
          totalPaid: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]),

    // Individual teacher-wise payment details
    TeacherPayment.aggregate([
      {
        $match: {
          billingMonth: { $in: months }
        }
      },
      {
        $sort: {
          paymentDate: -1
        }
      },
      {
        $group: {
          _id: {
            teacherId: "$teacherId",
            billingMonth: "$billingMonth"
          },

          totalPaid: {
            $sum: "$amount"
          },

          paymentCount: {
            $sum: 1
          },

          paymentRecords: {
            $push: {
              amount: "$amount",
              paymentDate: "$paymentDate",
              paymentMethod: "$paymentMethod",
              note: "$note"
            }
          }
        }
      },
      {
        $sort: {
          "_id.billingMonth": -1
        }
      }
    ]),

    // Recent expenses
    Expense.find({
      isCancelled: false,
      expenseDate: {
        $gte: new Date(
          `${months[months.length - 1]}-01T00:00:00.000Z`
        )
      }
    })
      .select(
        "category amount expenseDate description paidBy teacherCountSnapshot allocations"
      )
      .sort({ expenseDate: -1 })
      .limit(100)
      .lean(),

    // Current month outstanding fees
    Fee.find({
      billingMonth: currentMonth,
      dueAmount: { $gt: 0 }
    })
      .select(
        "studentId subjectId teacherId netFee paidAmount dueAmount paymentStatus billingMonth"
      )
      .populate("studentId", "studentId name className")
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ dueAmount: -1 })
      .limit(20)
      .lean(),

    // All current month fee records for payment status classification
    Fee.find({
      billingMonth: currentMonth
    })
      .select(
        "studentId subjectId teacherId netFee paidAmount dueAmount paymentStatus billingMonth"
      )
      .populate("studentId", "studentId name className status")
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ studentId: 1 })
      .lean(),

    // Active schedules
    Schedule.find({ status: "active" })
      .select("day subjectId className teacherId startTime endTime room")
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .limit(50)
      .lean(),

    // Notifications
    Notification.find()
      .populate("sender", "name role")
      .populate("recipients", "name role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
  ]);

  // Student directory with subject enrollment details

  const studentDirectory = studentDirectoryRecords.map((student) => {
    const enrolledSubjects = (student.subjects || []).map((enrollment) => ({
      subject: enrollment.subjectId?.name || "Unknown Subject",
      teacher: enrollment.teacherId?.name || "Unknown Teacher",
      teacherId: enrollment.teacherId?.teacherId || null,
      fee: enrollment.fee,
      startedAt: enrollment.startedAt
    }));

    return {
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      board: student.board,
      school: student.school,
      status: student.status,
      admissionDate: student.admissionDate,
      enrolledSubjects,
      totalSubjects: enrolledSubjects.length,
      isMultiSubject: enrolledSubjects.length > 1
    };
  });

  const multiSubjectStudents = studentDirectory.filter(
    (student) => student.isMultiSubject
  );

  const activeMultiSubjectStudents = multiSubjectStudents.filter(
  (student) => student.status === "active"
);

  // Teacher directory

  const teacherDirectory = teacherDirectoryRecords.map((teacher) => ({
    teacherId: teacher.teacherId,
    name: teacher.name,
    currentCommissionPercentage: teacher.commission,
    status: teacher.status
  }));

  // Teacher-wise financial details

  const teacherWiseFinancials = teacherDirectoryRecords.map((teacher) => {
    const teacherId = teacher._id.toString();

    const monthlyRecords = months.map((month) => {
      const earning = teacherWiseEarningRecords.find(
        (record) =>
          record._id.teacherId.toString() === teacherId &&
          record._id.billingMonth === month
      );

      const payment = teacherWisePaymentRecords.find(
        (record) =>
          record._id.teacherId.toString() === teacherId &&
          record._id.billingMonth === month
      );

      const studentCollection = earning?.totalCollected || 0;
      const teacherEarned = earning?.totalTeacherEarned || 0;
      const centerCommission = earning?.totalCenterCommission || 0;
      const amountPaid = payment?.totalPaid || 0;

      return {
        billingMonth: month,

        studentCollection,

        centerCommission,

        centerCommissionRates: earning?.commissionRates || [],

        effectiveCenterCommissionPercentage:
          studentCollection > 0
            ? Number(
                (
                  (centerCommission / studentCollection) * 100
                ).toFixed(2)
              )
            : 0,

        teacherEarned,

        amountPaid,

        outstandingPayable: Math.max(
          0,
          teacherEarned - amountPaid
        ),

        advancePaid: Math.max(
          0,
          amountPaid - teacherEarned
        ),

        earningRecordCount: earning?.earningRecordCount || 0,

        paymentCount: payment?.paymentCount || 0,

        paymentRecords: payment?.paymentRecords || []
      };
    }).filter(
      (record) =>
        record.earningRecordCount > 0 ||
        record.paymentCount > 0
    );

    const totals = monthlyRecords.reduce(
      (result, record) => ({
        studentCollection:
          result.studentCollection + record.studentCollection,

        centerCommission:
          result.centerCommission + record.centerCommission,

        teacherEarned:
          result.teacherEarned + record.teacherEarned,

        amountPaid:
          result.amountPaid + record.amountPaid,

        outstandingPayable:
          result.outstandingPayable + record.outstandingPayable,

        advancePaid:
          result.advancePaid + record.advancePaid
      }),
      {
        studentCollection: 0,
        centerCommission: 0,
        teacherEarned: 0,
        amountPaid: 0,
        outstandingPayable: 0,
        advancePaid: 0
      }
    );

    return {
      teacherId: teacher.teacherId,
      name: teacher.name,
      currentCommissionPercentage: teacher.commission,
      status: teacher.status,

      totals,

      monthlyRecords
    };
  });

  // Expense details

  const expenses = expenseRecords.map((expense) => ({
    category: expense.category,
    amount: expense.amount,
    date: expense.expenseDate,
    description: expense.description,
    paidBy: expense.paidBy,
    teacherCountSnapshot: expense.teacherCountSnapshot,
    teacherAllocationCount: expense.allocations?.length || 0
  }));

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Outstanding fees

  // Current month fee payment status classification

  const feePaymentRecords = currentMonthFeeRecords.map((fee) => {
    let calculatedStatus = "needs_review";

    if (
      fee.dueAmount === 0 &&
      fee.paidAmount >= fee.netFee
    ) {
      calculatedStatus = "fully_paid";
    } else if (
      fee.paidAmount > 0 &&
      fee.dueAmount > 0
    ) {
      calculatedStatus = "partially_paid";
    } else if (
      fee.paidAmount === 0 &&
      fee.dueAmount > 0
    ) {
      calculatedStatus = "unpaid";
    }

    return {
      studentId: fee.studentId?.studentId,
      studentName: fee.studentId?.name,
      className: fee.studentId?.className,
      studentStatus: fee.studentId?.status,
      subject: fee.subjectId?.name,
      teacher: fee.teacherId?.name,
      billingMonth: fee.billingMonth,
      netFee: fee.netFee,
      paidAmount: fee.paidAmount,
      dueAmount: fee.dueAmount,
      paymentStatus: fee.paymentStatus,
      calculatedStatus,
      statusMismatch: fee.paymentStatus !== (
        calculatedStatus === "fully_paid"
          ? "paid"
          : calculatedStatus === "partially_paid"
            ? "partial"
            : calculatedStatus === "unpaid"
              ? "due"
              : "needs_review"
      )
    };
  });

  const feePaymentStatusSummary = {
    billingMonth: currentMonth,
    totalFeeRecords: feePaymentRecords.length,

    fullyPaid: feePaymentRecords.filter(
      (fee) => fee.calculatedStatus === "fully_paid"
    ).length,

    partiallyPaid: feePaymentRecords.filter(
      (fee) => fee.calculatedStatus === "partially_paid"
    ).length,

    unpaid: feePaymentRecords.filter(
      (fee) => fee.calculatedStatus === "unpaid"
    ).length,

    needsReview: feePaymentRecords.filter(
      (fee) => fee.calculatedStatus === "needs_review"
    ).length
  };

  // Students without a fee record for the current billing month

  const studentsWithFeeRecords = new Set(
    currentMonthFeeRecords
      .filter((fee) => fee.studentId?._id)
      .map((fee) => fee.studentId._id.toString())
  );

  const studentsWithoutFeeRecords = studentDirectoryRecords
    .filter(
      (student) => !studentsWithFeeRecords.has(student._id.toString())
    )
    .map((student) => ({
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      status: student.status
    }));


  const outstandingFees = recentDueFees.map((fee) => ({
    studentId: fee.studentId?.studentId,
    studentName: fee.studentId?.name,
    className: fee.studentId?.className,
    subject: fee.subjectId?.name,
    teacher: fee.teacherId?.name,
    billingMonth: fee.billingMonth,
    netFee: fee.netFee,
    paidAmount: fee.paidAmount,
    dueAmount: fee.dueAmount,
    paymentStatus: fee.paymentStatus
  }));

  // Schedule details

  const scheduleList = schedules.map((schedule) => ({
    day: schedule.day,
    subject: schedule.subjectId?.name,
    className: schedule.className,
    teacher: schedule.teacherId?.name,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room
  }));

  // Notifications details

  const notifications = notificationRecords.map((notification) => ({
    title: notification.title,
    message: notification.message,
    targetType: notification.targetType,
    senderRole: notification.senderRole,
    senderName: notification.sender?.name || "Unavailable",
    recipients: (notification.recipients || []).map((recipient) => ({
      name: recipient.name,
      role: recipient.role
    })),
    recipientCount: notification.recipients?.length || 0,
    date: notification.createdAt,
    adminRead: notification.adminRead
  }));

  // Admin context details

  return {
    role: "admin",
    publicCoachingInfo,

    currentBillingMonth: currentMonth,
    recentBillingMonths: months,
    today: getTodayInIndia(),

    students: {
      total: totalStudents,
      active: activeStudents,
      inactiveOrLeft: inactiveStudents,
      multiSubjectCount: multiSubjectStudents.length,
      multiSubjectRecords: multiSubjectStudents,
      activeMultiSubjectCount: activeMultiSubjectStudents.length,
      activeMultiSubjectRecords: activeMultiSubjectStudents,
      records: studentDirectory
    },

    teachers: {
      total: totalTeachers,
      active: activeTeachers,
      directory: teacherDirectory
    },

    feeSummary,

    teacherEarningSummary: earningSummary,
    teacherPaymentSummary: paymentSummary,

    teacherWiseFinancials,

    expenses: {
      recentRecords: expenses,
      totalInRecentPeriod: totalExpenses
    },

        outstandingFees,

    feePaymentStatus: {
      summary: feePaymentStatusSummary,
      records: feePaymentRecords
    },

    studentsWithoutFeeRecords,

    schedules: scheduleList,

    notifications: {
      totalRecords: notifications.length,
      records: notifications
    }
  };
};

// Teacher AI context

export const getTeacherAIContext = async (userId) => {
  const months = getRecentBillingMonths();

  const [
    publicCoachingInfo,
    teacher
  ] = await Promise.all([
    getPublicCoachingContext(),

    Teacher.findOne({ userId })
      .select("teacherId name subjects commission status")
      .populate("subjects", "name")
      .lean()
  ]);

  if (!teacher) {
    throw new Error("Teacher profile not found.");
  }

  const [
    students,
    earnings,
    payments,
    schedules,
    expenseRecords
  ] = await Promise.all([
    Student.find({
      "subjects.teacherId": teacher._id
    })
      .select("studentId name className status subjects")
      .populate("subjects.subjectId", "name")
      .lean(),

    TeacherEarning.find({
      teacherId: teacher._id,
      billingMonth: { $in: months }
    })
      .select("billingMonth collectedAmount teacherEarned commission")
      .sort({ billingMonth: -1 })
      .lean(),

    TeacherPayment.find({
      teacherId: teacher._id,
      billingMonth: { $in: months }
    })
      .select("billingMonth amount paymentDate paymentMethod")
      .sort({ paymentDate: -1 })
      .lean(),

    Schedule.find({
      teacherId: teacher._id,
      status: "active"
    })
      .select("day subjectId className startTime endTime room")
      .populate("subjectId", "name")
      .lean(),

    Expense.find({
      isCancelled: false,
      "allocations.teacherId": teacher._id
    })
      .select("category expenseDate description allocations")
      .sort({ expenseDate: -1 })
      .limit(50)
      .lean()
  ]);

  // Assigned students

  const teacherStudents = students.map((student) => {
    const assignedSubjects = student.subjects
      .filter(
        (enrollment) =>
          enrollment.teacherId?.toString() === teacher._id.toString()
      )
      .map((enrollment) => ({
        subject: enrollment.subjectId?.name,
        fee: enrollment.fee
      }));

    return {
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      status: student.status,
      subjects: assignedSubjects
    };
  });

  // Earnings totals

  const totalEarned = earnings.reduce(
    (sum, earning) => sum + earning.teacherEarned,
    0
  );

  const totalCollected = earnings.reduce(
    (sum, earning) => sum + earning.collectedAmount,
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Expense contributions

  const contributions = expenseRecords.map((expense) => {
    const allocation = expense.allocations.find(
      (item) =>
        item.teacherId?.toString() === teacher._id.toString()
    );

    if (!allocation) return null;

    return {
      category: expense.category,
      date: expense.expenseDate,
      description: expense.description,
      allocatedAmount: allocation.allocatedAmount,
      paidAmount: allocation.paidAmount,
      remainingAmount: Math.max(
        0,
        allocation.allocatedAmount - allocation.paidAmount
      )
    };
  }).filter(Boolean);

  // Schedule details

  const scheduleList = schedules.map((schedule) => ({
    day: schedule.day,
    subject: schedule.subjectId?.name,
    className: schedule.className,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room
  }));

  return {
    role: "teacher",
    publicCoachingInfo,

    currentBillingMonth: months[0],
    recentBillingMonths: months,
    today: getTodayInIndia(),

    teacher: {
      teacherId: teacher.teacherId,
      name: teacher.name,
      subjects: teacher.subjects.map((subject) => subject.name),
      currentCommissionPercentage: teacher.commission,
      status: teacher.status
    },

    students: {
      totalAssigned: teacherStudents.length,
      records: teacherStudents.slice(0, 100)
    },

    earnings: {
      totalCollected,
      totalEarned,
      totalPaid,
      outstandingPayable: Math.max(0, totalEarned - totalPaid),
      records: earnings
    },

    payments,
    schedules: scheduleList,
    expenseContributions: contributions
  };
};

// Student AI context

export const getStudentAIContext = async (userId) => {
  const months = getRecentBillingMonths();

  const [
    publicCoachingInfo,
    student
  ] = await Promise.all([
    getPublicCoachingContext(),

    Student.findOne({ userId })
      .select(
        "studentId name className board school subjects status admissionDate"
      )
      .populate("subjects.subjectId", "name")
      .populate("subjects.teacherId", "name")
      .lean()
  ]);

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const [
    fees,
    notifications,
    schedules
  ] = await Promise.all([
    Fee.find({
      studentId: student._id,
      billingMonth: { $in: months }
    })
      .select(
        "subjectId teacherId billingMonth netFee paidAmount dueAmount paymentStatus payments"
      )
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ billingMonth: -1 })
      .limit(100)
      .lean(),

    Notification.find({
      recipients: userId
    })
      .select("title message createdAt readBy")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    Schedule.find({
      $or: student.subjects.map((enrollment) => ({
        subjectId: enrollment.subjectId?._id || enrollment.subjectId,
        teacherId: enrollment.teacherId?._id || enrollment.teacherId
      })),
      status: "active"
    })
      .select("day subjectId teacherId className startTime endTime room")
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .lean()
  ]);

  // Student fee records

  const feeRecords = fees.map((fee) => ({
    subject: fee.subjectId?.name,
    teacher: fee.teacherId?.name,
    billingMonth: fee.billingMonth,
    netFee: fee.netFee,
    paidAmount: fee.paidAmount,
    dueAmount: fee.dueAmount,
    paymentStatus: fee.paymentStatus,
    payments: (fee.payments || []).map((payment) => ({
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod
    }))
  }));

  // Fee totals

  const totalFee = fees.reduce(
    (sum, fee) => sum + fee.netFee,
    0
  );

  const totalPaid = fees.reduce(
    (sum, fee) => sum + fee.paidAmount,
    0
  );

  const totalDue = fees.reduce(
    (sum, fee) => sum + fee.dueAmount,
    0
  );

  // Enrolled subjects

  const enrolledSubjects = student.subjects.map((enrollment) => ({
    subject: enrollment.subjectId?.name,
    teacher: enrollment.teacherId?.name,
    monthlyFee: enrollment.fee,
    startedAt: enrollment.startedAt
  }));

  // Schedule details

  const scheduleList = schedules.map((schedule) => ({
    day: schedule.day,
    subject: schedule.subjectId?.name,
    teacher: schedule.teacherId?.name,
    className: schedule.className,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room
  }));

  // Student notifications

  const notificationList = notifications.map((notification) => ({
    title: notification.title,
    message: notification.message,
    date: notification.createdAt,
    isRead: notification.readBy.some(
      (id) => id.toString() === userId.toString()
    )
  }));

  return {
    role: "student",
    publicCoachingInfo,

    currentBillingMonth: months[0],
    recentBillingMonths: months,
    today: getTodayInIndia(),

    student: {
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      board: student.board,
      school: student.school,
      status: student.status,
      admissionDate: student.admissionDate
    },

    subjects: enrolledSubjects,

    fees: {
      totalFee,
      totalPaid,
      totalDue,
      records: feeRecords
    },

    schedules: scheduleList,
    notifications: notificationList
  };
};
