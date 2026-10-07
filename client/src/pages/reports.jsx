import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./reports.css"
const API = "http://localhost:3000/api"

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
                fetch(
                    `${API}/reports/fees${monthQuery}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                ),
                fetch(
                    `${API}/reports/teacher-payments${monthQuery}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                ),
                fetch(
                    `${API}/reports/students`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                ),
                fetch(
                    `${API}/reports/summary${monthQuery}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
            ])
            const feeData =
                await feeResponse.json()
            const teacherData =
                await teacherResponse.json()
            const studentData =
                await studentResponse.json()
            const summaryData =
                await summaryResponse.json()
            if (!feeResponse.ok) {
                throw new Error(
                    feeData.message ||
                    "Failed to load fee report"
                )
            }
            if (!teacherResponse.ok) {
                throw new Error(
                    teacherData.message ||
                    "Failed to load teacher payment report"
                )
            }
            if (!studentResponse.ok) {
                throw new Error(
                    studentData.message ||
                    "Failed to load student report"
                )
            }
            if (!summaryResponse.ok) {
                throw new Error(
                    summaryData.message ||
                    "Failed to load financial summary"
                )
            }
            setFees(feeData.fees || [])
            setTeacherPayments(
                teacherData.teachers || []
            )
            setStudentReport(studentData)
            setSummary(summaryData)
        } catch (error) {
            console.error(
                "Failed to load reports:",
                error
            )
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

    const feeStatus = useMemo(() => {
        return fees.reduce(
            (result, fee) => {
                if (
                    fee.paymentStatus === "paid"
                ) {
                    result.paid++
                } else if (
                    fee.paymentStatus === "partial"
                ) {
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

    const monthlyCollection = useMemo(() => {
        const data = {}
        fees.forEach((fee) => {
            const month =
                fee.billingMonth
            if (!data[month]) {
                data[month] = 0
            }
            data[month] +=
                Number(fee.paidAmount || 0)
        })
        return Object.entries(data)
            .sort(([a], [b]) =>
                a.localeCompare(b)
            )
            .map(([month, amount]) => ({
                month,
                amount
            }))
    }, [fees])
    const maxCollection = Math.max(
        ...monthlyCollection.map(
            (item) => item.amount
        ),
        1
    )
    const feePageCount = Math.ceil(fees.length / recordsPerPage)
    const teacherPageCount = Math.ceil(teacherPayments.length / recordsPerPage)
    const paginatedFees = fees.slice(
        (feePage - 1) * recordsPerPage,
        feePage * recordsPerPage
    )
    const paginatedTeacherPayments = teacherPayments.slice(
        (teacherPage - 1) * recordsPerPage,
        teacherPage * recordsPerPage
    )

    const formatMoney = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`
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
            {/* HEADER */}
            <div className="reports-header">
            <div>
                <h1>Reports</h1>
                <p>View financial, student and teacher payment reports</p>
            </div>
            <div className="reports-actions">
                <button type="button" onClick={() => navigate(-1)}>Back</button>
                <button type="button" onClick={() => window.print()}>Print</button>
            </div>
        </div>
              {/* FILTER */}
                <section className="reports-filter-card">
                 <div className="reports-filter-group">
                 <label>
                    Billing Month
                 </label>
                <select
                    value={billingMonth}
                    onChange={(event) =>
                    setBillingMonth(
                    event.target.value
                )
            }
        >
            <option value="all">
                All Months
            </option>
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
            {/* SUMMARY CARDS */}
            {summary && (
                <div className="reports-summary-grid">
                    <div className="report-summary-card">
                        <span>
                            Total Fee Generated
                        </span>
                        <strong>
                            {formatMoney(
                                summary.totalFeeGenerated
                            )}
                        </strong>
                    </div>
                    <div className="report-summary-card">
                        <span>
                            Total Collection
                        </span>
                        <strong>
                            {formatMoney(
                                summary.totalCollection
                            )}
                        </strong>
                    </div>
                    <div className="report-summary-card">
                        <span>
                            Total Outstanding
                        </span>
                        <strong>
                            {formatMoney(
                                summary.totalOutstanding
                            )}
                        </strong>
                    </div>
                    <div className="report-summary-card">
                        <span>
                            Center Commission
                        </span>
                        <strong>
                            {formatMoney(
                                summary.totalCenterCommission
                            )}
                        </strong>
                    </div>
                    <div className="report-summary-card">
                        <span>
                            Teacher Share
                        </span>
                        <strong>
                            {formatMoney(
                                summary.totalTeacherShare
                            )}
                        </strong>
                    </div>
                </div>
            )}
            {/* CHARTS */}
            <div className="reports-chart-grid">
                {/* COLLECTION TREND */}
                <section className="report-panel">
                    <div className="report-panel-header">
                        <div>
                            <h2>
                                Fee Collection Trend
                            </h2>
                            <p>
                                Collection by billing month
                            </p>
                        </div>
                    </div>
                    <div className="collection-chart">
                        {monthlyCollection.map(
                            (item) => {
                                const height =
                                    Math.max(
                                        (item.amount /
                                            maxCollection) *
                                            100,
                                        3
                                    )
                                return (
                                    <div
                                        className="collection-column"
                                        key={item.month}
                                    >
                                        <div className="collection-value">
                                            {formatMoney(
                                                item.amount
                                            )}
                                        </div>
                                        <div
                                            className="collection-bar"
                                            style={{
                                                height:
                                                    `${height}%`
                                            }}
                                        />
                                        <span>
                                            {item.month}
                                        </span>
                                    </div>
                                )
                            }
                        )}
                    </div>
                </section>
                {/* FEE STATUS */}
                <section className="report-panel">
                    <div className="report-panel-header">
                        <div>
                            <h2>
                                Fee Status
                            </h2>
                            <p>
                                Payment status of fee records
                            </p>
                        </div>
                    </div>
                    <div className="fee-status-content">
                        <div
                            className="fee-status-circle"
                            style={{
                                background:
                                    `conic-gradient(
                                        #22c55e 0 ${
                                            (
                                                feeStatus.paid /
                                                Math.max(
                                                    fees.length,
                                                    1
                                                )
                                            ) * 100
                                        }%,
                                        #f59e0b ${
                                            (
                                                feeStatus.paid /
                                                Math.max(
                                                    fees.length,
                                                    1
                                                )
                                            ) * 100
                                        }% ${
                                            (
                                                (
                                                    feeStatus.paid +
                                                    feeStatus.partial
                                                ) /
                                                Math.max(
                                                    fees.length,
                                                    1
                                                )
                                            ) * 100
                                        }%,
                                        #ef4444 ${
                                            (
                                                (
                                                    feeStatus.paid +
                                                    feeStatus.partial
                                                ) /
                                                Math.max(
                                                    fees.length,
                                                    1
                                                )
                                            ) * 100
                                        }% 100%
                                    )`
                            }}
                        >
                            <div>
                                {fees.length}
                            </div>
                        </div>
                        <div className="fee-status-legend">
                            <div>
                                <span className="legend-dot paid" />
                                Paid
                                <strong>
                                    {feeStatus.paid}
                                </strong>
                            </div>
                            <div>
                                <span className="legend-dot partial" />
                                Partial
                                <strong>
                                    {feeStatus.partial}
                                </strong>
                            </div>
                            <div>
                                <span className="legend-dot due" />
                                Due
                                <strong>
                                    {feeStatus.due}
                                </strong>
                            </div>
                        </div>
                    </div>
                </section>
                {/* TEACHER PAYMENT */}
                <section className="report-panel">
                    <div className="report-panel-header">
                        <div>
                            <h2>
                                Teacher Payments
                            </h2>
                            <p>
                                Actual teacher payment from
                                collected fees
                            </p>
                        </div>
                    </div>
                    <div className="teacher-payment-chart">
                        {teacherPayments.map(
                            (teacher) => {
                                const width =
                                    Math.max(
                                        (
                                            teacher.teacherPayment /
                                            Math.max(
                                                ...teacherPayments.map(
                                                    (item) =>
                                                        item.teacherPayment
                                                ),
                                                1
                                            )
                                        ) * 100,
                                        2
                                    )
                                return (
                                    <div
                                        className="teacher-payment-row"
                                        key={teacher.teacherId}
                                    >
                                        <div className="teacher-payment-name">
                                            <span>
                                                {teacher.teacherName}
                                            </span>
                                            <strong>
                                                {formatMoney(
                                                    teacher.teacherPayment
                                                )}
                                            </strong>
                                        </div>
                                        <div className="teacher-payment-track">
                                            <div
                                                className="teacher-payment-bar"
                                                style={{
                                                    width:
                                                        `${width}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        )}
                    </div>
                </section>
                {/* STUDENT DISTRIBUTION */}
                <section className="report-panel">
                    <div className="report-panel-header">
                        <div>
                            <h2>
                                Student Distribution
                            </h2>
                            <p>
                                Students by class
                            </p>
                        </div>
                    </div>
                    <div className="student-class-list">
                        {studentReport?.studentsByClass?.map(
                            (item) => (
                                <div
                                    className="student-class-row"
                                    key={item.className}
                                >
                                    <span>
                                        Class {item.className}
                                    </span>
                                    <div className="student-class-track">
                                        <div
                                            className="student-class-bar"
                                            style={{
                                                width:
                                                    `${(
                                                        item.count /
                                                        studentReport.totalStudents
                                                    ) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <strong>
                                        {item.count}
                                    </strong>
                                </div>
                            )
                        )}
                    </div>
                </section>
            </div>
            {/* FEE REPORT TABLE */}
            <section className="report-table-panel">
                <div className="report-panel-header">
                    <div>
                        <h2>
                            Fee Report
                        </h2>
                        <p>
                            Detailed student fee records
                        </p>
                    </div>
                    <span>
                        {fees.length} records
                    </span>
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
                                    <td>
                                        {fee.billingMonth}
                                    </td>
                                    <td>
                                        <strong>
                                            {fee.studentName}
                                        </strong>
                                        <small>
                                            {fee.studentId}
                                        </small>
                                    </td>
                                    <td>
                                        {fee.className}
                                    </td>
                                    <td>
                                        {fee.subject}
                                    </td>
                                    <td>
                                        {fee.teacherName}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            fee.originalFee
                                        )}
                                    </td>
                                    <td>
                                        {fee.discount}%
                                    </td>
                                    <td>
                                        {formatMoney(
                                            fee.netFee
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            fee.paidAmount
                                        )}
                                    </td>
                                    <td>
                                        {formatMoney(
                                            fee.dueAmount
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                `report-status ${fee.paymentStatus}`
                                            }
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
                        Previous
                    </button>
                    <span>
                        {fees.length === 0
                            ? "No records"
                            : `Showing ${(feePage - 1) * recordsPerPage + 1}-${Math.min(feePage * recordsPerPage, fees.length)} of ${fees.length}`}
                    </span>
                    <button
                        type="button"
                        onClick={() => setFeePage(feePage + 1)}
                        disabled={feePage >= feePageCount}
                    >
                        Next
                    </button>
                </div>
            </section>
            {/* TEACHER PAYMENT TABLE */}
            <section className="report-table-panel">
                <div className="report-panel-header">
                    <div>
                        <h2>
                            Teacher Payment Report
                        </h2>
                        <p>
                            Teacher-wise fee collection
                            and payment
                        </p>
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
                            {paginatedTeacherPayments.map(
                                (teacher) => (
                                    <tr
                                        key={
                                            teacher.teacherId
                                        }
                                    >
                                        <td>
                                            <strong>
                                                {
                                                    teacher.teacherName
                                                }
                                            </strong>
                                            <small>
                                                {
                                                    teacher.teacherId
                                                }
                                            </small>
                                        </td>
                                        <td>
                                            {
                                                teacher.commission
                                            }%
                                        </td>
                                        <td>
                                            {formatMoney(
                                                teacher.applicableFees
                                            )}
                                        </td>
                                        <td>
                                            {formatMoney(
                                                teacher.collectedAmount
                                            )}
                                        </td>
                                        <td>
                                            {formatMoney(
                                                teacher.centerCommission
                                            )}
                                        </td>
                                        <td>
                                            {formatMoney(
                                                teacher.teacherPayment
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="report-pagination">
                    <button
                        type="button"
                        onClick={() => setTeacherPage(teacherPage - 1)}
                        disabled={teacherPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        {teacherPayments.length === 0
                            ? "No records"
                            : `Showing ${(teacherPage - 1) * recordsPerPage + 1}-${Math.min(teacherPage * recordsPerPage, teacherPayments.length)} of ${teacherPayments.length}`}
                    </span>
                    <button
                        type="button"
                        onClick={() => setTeacherPage(teacherPage + 1)}
                        disabled={teacherPage >= teacherPageCount}
                    >
                        Next
                    </button>
                </div>
            </section>
            {/* STUDENT SUMMARY */}

            {studentReport && (
                <section className="report-table-panel">
                    <div className="report-panel-header">
                        <div>
                            <h2>
                                Student Report
                            </h2>
                            <p>
                                Student statistics
                            </p>
                        </div>
                    </div>
                    <div className="student-summary-grid">
                        <div>
                            <span>Total Students</span>
                            <strong>
                                {studentReport.totalStudents}
                            </strong>
                        </div>
                        <div>
                            <span>Active Students</span>
                            <strong>
                                {studentReport.activeStudents}
                            </strong>
                        </div>
                        <div>
                            <span>Inactive Students</span>
                            <strong>
                                {studentReport.inactiveStudents}
                            </strong>
                        </div>
                        <div>
                            <span>Multi-subject Students</span>
                            <strong>
                                {studentReport.multiSubjectStudents}
                            </strong>
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