
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileBarChart,
  ChevronLeft,
  Printer,
  CalendarDays,
  IndianRupee,
  Wallet,
  CircleAlert,
  Building2,
  GraduationCap,
  TrendingUp,
  ChartPie,
  Users,
  ReceiptText,
  ChevronRight
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import Sidebar from "../components/sidebar"
import "./reports.css"

const API = "https://scms-backend-uhfo.onrender.com/api"

const CHART_COLORS = {
  primary: "#0D9488",
  teacher: "#2E5F99",
  student: "#FE4400",
  paid: "#22c55e",
  partial: "#f59e0b",
  due: "#ef4444"
}

function Reports() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const [billingMonth, setBillingMonth] = useState("all")
  const [fees, setFees] = useState([])
  const [teacherPayments, setTeacherPayments] = useState([])
  const [studentReport, setStudentReport] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [feePage, setFeePage] = useState(1)
  const [teacherPage, setTeacherPage] = useState(1)

  const recordsPerPage = 10

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError("")

      const monthQuery =
        billingMonth === "all"
          ? ""
          : `?billingMonth=${billingMonth}`

      const [
        feeResponse,
        teacherResponse,
        studentResponse,
        summaryResponse
      ] = await Promise.all([
        fetch(`${API}/reports/fees${monthQuery}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API}/reports/teacher-payments${monthQuery}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API}/reports/students`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${API}/reports/summary${monthQuery}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ])

      const feeData = await feeResponse.json()
      const teacherData = await teacherResponse.json()
      const studentData = await studentResponse.json()
      const summaryData = await summaryResponse.json()

      if (!feeResponse.ok) {
        throw new Error(
          feeData.message || "Failed to load fee report"
        )
      }

      if (!teacherResponse.ok) {
        throw new Error(
          teacherData.message || "Failed to load teacher payment report"
        )
      }

      if (!studentResponse.ok) {
        throw new Error(
          studentData.message || "Failed to load student report"
        )
      }

      if (!summaryResponse.ok) {
        throw new Error(
          summaryData.message || "Failed to load financial summary"
        )
      }

      setFees(feeData.fees || [])
      setTeacherPayments(teacherData.teachers || [])
      setStudentReport(studentData)
      setSummary(summaryData)
    } catch (error) {
      console.error("Failed to load reports:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFeePage(1)
    setTeacherPage(1)
    fetchReports()
  }, [billingMonth])

  // Fee payment status
  const feeStatus = useMemo(() => {
    return fees.reduce(
      (result, fee) => {
        if (fee.paymentStatus === "paid") {
          result.paid++
        } else if (fee.paymentStatus === "partial") {
          result.partial++
        } else {
          result.due++
        }

        return result
      },
      {
        paid: 0,
        partial: 0,
        due: 0
      }
    )
  }, [fees])

  // Monthly collection data
  const monthlyCollection = useMemo(() => {
    const data = {}

    fees.forEach((fee) => {
      const month = fee.billingMonth

      if (!data[month]) {
        data[month] = 0
      }

      data[month] += Number(fee.paidAmount || 0)
    })

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        amount
      }))
  }, [fees])

  // Fee status chart data
  const feeStatusData = [
    { name: "Paid", value: feeStatus.paid, color: CHART_COLORS.paid },
    { name: "Partial", value: feeStatus.partial, color: CHART_COLORS.partial },
    { name: "Due", value: feeStatus.due, color: CHART_COLORS.due }
  ]

  // Teacher payment chart data
  const teacherPaymentData = teacherPayments.map((teacher) => ({
    name: teacher.teacherName,
    amount: Number(teacher.teacherPayment || 0)
  }))

  // Student distribution chart data
  const studentClassData = (studentReport?.studentsByClass || []).map(
    (item) => ({
      className: `Class ${item.className}`,
      students: Number(item.count || 0)
    })
  )

  const feePageCount = Math.ceil(fees.length / recordsPerPage)
  const teacherPageCount = Math.ceil(
    teacherPayments.length / recordsPerPage
  )

  const paginatedFees = fees.slice(
    (feePage - 1) * recordsPerPage,
    feePage * recordsPerPage
  )

  const paginatedTeacherPayments = teacherPayments.slice(
    (teacherPage - 1) * recordsPerPage,
    teacherPage * recordsPerPage
  )

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`
  }

  const formatMonth = (value) => {
    if (!value) return ""

    const [year, month] = value.split("-")
    const date = new Date(Number(year), Number(month) - 1)

    return date.toLocaleString("en-IN", {
      month: "short",
      year: "numeric"
    })
  }

  const formatChartMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1
    })}`
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-content">
          <div className="reports-page">
            <div className="reports-loading">
              Loading reports...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-content">
          <div className="reports-page">
            <div className="reports-error">
              {error}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="reports-page">
          <div className="reports-header">
            <div>
              <h1>
                <FileBarChart size={22} />
                Reports
              </h1>
              <p>
                View financial, student and teacher payment reports
              </p>
            </div>

            <div className="reports-actions">
              <button
                type="button"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                type="button"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>

          <section className="reports-filter-card">
            <div className="reports-filter-group">
              <label>
                <CalendarDays size={16} />
                Billing Month
              </label>

              <select
                value={billingMonth}
                onChange={(event) =>
                  setBillingMonth(event.target.value)
                }
              >
                <option value="all">All Months</option>

                {Array.from({ length: 7 }, (_, index) => {
                  const date = new Date()
                  date.setDate(1)
                  date.setMonth(date.getMonth() - index)

                  if (
                    date.getFullYear() === 2026 &&
                    date.getMonth() < 3
                  ) {
                    return null
                  }

                  const value = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                  ).padStart(2, "0")}`

                  const label = date.toLocaleString("default", {
                    month: "long",
                    year: "numeric"
                  })

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
          </section>

          {summary && (
            <div className="reports-summary-grid">
              <div className="report-summary-card">
                <span>
                  <IndianRupee size={17} />
                  Total Fee Generated
                </span>
                <strong>
                  {formatMoney(summary.totalFeeGenerated)}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>
                  <Wallet size={17} />
                  Total Collection
                </span>
                <strong>
                  {formatMoney(summary.totalCollection)}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>
                  <CircleAlert size={17} />
                  Total Outstanding
                </span>
                <strong>
                  {formatMoney(summary.totalOutstanding)}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>
                  <Building2 size={17} />
                  Center Commission
                </span>
                <strong>
                  {formatMoney(summary.totalCenterCommission)}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>
                  <GraduationCap size={17} />
                  Teacher Share
                </span>
                <strong>
                  {formatMoney(summary.totalTeacherShare)}
                </strong>
              </div>
            </div>
          )}

          {/* Recharts */}
          <div className="reports-chart-grid">

            {/* Fee Collection Trend */}
            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h2>
                    <TrendingUp size={18} />
                    Fee Collection Trend
                  </h2>
                  <p>Collection by billing month</p>
                </div>
              </div>

              <div
                className="recharts-container"
                style={{ width: "100%", height: 260, padding: "16px 12px 12px" }}
              >
                {monthlyCollection.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyCollection}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 5,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />

                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#d9dee3" }}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={formatChartMoney}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        width={65}
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatMoney(value),
                          "Collection"
                        ]}
                        labelFormatter={(label) => formatMonth(label)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #d9dee3",
                          fontSize: "12px"
                        }}
                      />

                      <Bar
                        dataKey="amount"
                        name="Collection"
                        fill={CHART_COLORS.primary}
                       
                        barSize={35}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    No collection data available
                  </div>
                )}
              </div>
            </section>

            {/* Fee Status */}
            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h2>
                    <ChartPie size={18} />
                    Fee Status
                  </h2>
                  <p>Payment status of fee records</p>
                </div>
              </div>

              <div
                className="recharts-container"
                style={{ width: "100%", height: 260, padding: "10px 12px" }}
              >
                {fees.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feeStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {feeStatusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value, name) => [
                          `${value} records`,
                          name
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #d9dee3",
                          fontSize: "12px"
                        }}
                      />

                        <Legend
                          verticalAlign="middle"
                           align="right"
                          layout="vertical"
                          iconType="circle"
                          iconSize={10}
                          itemGap={20}
                          wrapperStyle={{
                          fontSize: "12px",
                          color: "#475569",
                          transform: "translateX(-100px)",
                          lineHeight: "35px"
                           }}
                        />

                      <text
                        x="45%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#26313f"
                        fontSize="21"
                        fontWeight="600"
                      >
                        {fees.length}
                      </text>

                      <text
                        x="45%"
                        y="58%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#6b7280"
                        fontSize="11"
                      >
                        Records
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    No fee records available
                  </div>
                )}
              </div>
            </section>

            {/* Teacher Payments */}
            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h2>
                    <Wallet size={18} />
                    Teacher Payments
                  </h2>
                  <p>Actual teacher payment from collected fees</p>
                </div>
              </div>

              <div
                className="recharts-container"
                style={{
                  width: "100%",
                  height: Math.max(260, teacherPaymentData.length * 42),
                  padding: "16px 12px 16px"
                }}
              >
                {teacherPaymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teacherPaymentData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 20,
                        left: 10,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#e5e7eb"
                      />

                      <XAxis
                        type="number"
                        tickFormatter={formatChartMoney}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#d9dee3" }}
                        tickLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={105}
                        tick={{ fontSize: 11, fill: "#374151" }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatMoney(value),
                          "Teacher Payment"
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #d9dee3",
                          fontSize: "12px"
                        }}
                      />

                      <Bar
                        dataKey="amount"
                        name="Teacher Payment"
                        fill={CHART_COLORS.teacher}
                        barSize={14}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    No teacher payment data available
                  </div>
                )}
              </div>
            </section>

            {/* Student Distribution */}
            <section className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h2>
                    <Users size={19} />
                    Student Distribution
                  </h2>
                  <p>Students by class</p>
                </div>
              </div>

              <div
                className="recharts-container"
                style={{ width: "100%", height: 260, padding: "16px 12px 12px" }}
              >
                {studentClassData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentClassData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />

                      <XAxis
                        dataKey="className"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#d9dee3" }}
                        tickLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        formatter={(value) => [
                          value,
                          "Students"
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #d9dee3",
                          fontSize: "12px"
                        }}
                      />

                      <Bar
                        dataKey="students"
                        name="Students"
                        fill={CHART_COLORS.student}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    No student distribution data available
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Fee Report */}
          <section className="report-table-panel">
            <div className="report-panel-header">
              <div>
                <h2>
                  <ReceiptText size={19} />
                  Fee Report
                </h2>
                <p>Detailed student fee records</p>
              </div>
              <span>{fees.length} records</span>
            </div>

            <div className="report-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Original Fee</th>
                    <th>Discount</th>
                    <th>Net Fee</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedFees.map((fee) => (
                    <tr key={fee.id}>
                      <td>{fee.billingMonth}</td>
                      <td>
                        <strong>{fee.studentName}</strong>
                        <small>{fee.studentId}</small>
                      </td>
                      <td>{fee.className}</td>
                      <td>{fee.subject}</td>
                      <td>{fee.teacherName}</td>
                      <td>{formatMoney(fee.originalFee)}</td>
                      <td>{fee.discount}%</td>
                      <td>{formatMoney(fee.netFee)}</td>
                      <td>{formatMoney(fee.paidAmount)}</td>
                      <td>{formatMoney(fee.dueAmount)}</td>
                      <td>
                        <span
                          className={`report-status ${fee.paymentStatus}`}
                        >
                          {fee.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-pagination">
              <button
                type="button"
                onClick={() => setFeePage(feePage - 1)}
                disabled={feePage === 1}
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <span>
                {fees.length === 0
                  ? "No records"
                  : `Showing ${(feePage - 1) * recordsPerPage + 1}-${Math.min(
                      feePage * recordsPerPage,
                      fees.length
                    )} of ${fees.length}`}
              </span>

              <button
                type="button"
                onClick={() => setFeePage(feePage + 1)}
                disabled={feePage >= feePageCount}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </section>

          {/* Teacher Payment Report */}
          <section className="report-table-panel">
            <div className="report-panel-header">
              <div>
                <h2>
                  <Building2 size={19} />
                  Teacher Payment Report
                </h2>
                <p>Teacher-wise fee collection and payment</p>
              </div>
            </div>

            <div className="report-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Commission</th>
                    <th>Applicable Fees</th>
                    <th>Collected</th>
                    <th>Center Commission</th>
                    <th>Teacher Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTeacherPayments.map((teacher) => (
                    <tr key={teacher.teacherId}>
                      <td>
                        <strong>{teacher.teacherName}</strong>
                        <small>{teacher.teacherId}</small>
                      </td>
                      <td>{teacher.commission}%</td>
                      <td>{formatMoney(teacher.applicableFees)}</td>
                      <td>{formatMoney(teacher.collectedAmount)}</td>
                      <td>{formatMoney(teacher.centerCommission)}</td>
                      <td>{formatMoney(teacher.teacherPayment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-pagination">
              <button
                type="button"
                onClick={() => setTeacherPage(teacherPage - 1)}
                disabled={teacherPage === 1}
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <span>
                {teacherPayments.length === 0
                  ? "No records"
                  : `Showing ${(teacherPage - 1) * recordsPerPage + 1}-${Math.min(
                      teacherPage * recordsPerPage,
                      teacherPayments.length
                    )} of ${teacherPayments.length}`}
              </span>

              <button
                type="button"
                onClick={() => setTeacherPage(teacherPage + 1)}
                disabled={teacherPage >= teacherPageCount}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </section>

          {/* Student Report */}
          {studentReport && (
            <section className="report-table-panel">
              <div className="report-panel-header">
                <div>
                  <h2>
                    <GraduationCap size={19} />
                    Student Report
                  </h2>
                  <p>Student statistics</p>
                </div>
              </div>

              <div className="student-summary-grid">
                <div>
                  <span>Total Students</span>
                  <strong>{studentReport.totalStudents}</strong>
                </div>

                <div>
                  <span>Active Students</span>
                  <strong>{studentReport.activeStudents}</strong>
                </div>

                <div>
                  <span>Inactive Students</span>
                  <strong>{studentReport.inactiveStudents}</strong>
                </div>

                <div>
                  <span>Multi-subject Students</span>
                  <strong>{studentReport.multiSubjectStudents}</strong>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Reports
