import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ChevronLeft,
  ReceiptText,
  IndianRupee,
  UserCheck,
  CircleAlert,
  Wallet,
  PlusCircle,
  Search,
  GraduationCap,
  ChartNoAxesCombined,
  Users,
  BookOpen,
  Percent,
  UserRound
} from "lucide-react"
import "./fees.css"

function Fees() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [searchParams] = useSearchParams()

  const [billingMonth, setBillingMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7)
  })

  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])

  const [search, setSearch] = useState("")
  const [teacherFilter, setTeacherFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [summary, setSummary] = useState({
    totalOriginalFee: 0,
    totalNetFee: 0,
    totalCollection: 0,
    totalDue: 0
  })

  const [paidStudents, setPaidStudents] = useState(0)
  const [dueStudents, setDueStudents] = useState(0)

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [generating, setGenerating] = useState(false)

  const token = localStorage.getItem("token")

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatMonth = (value) => {
    const [year, month] = value.split("-")

    return new Date(
      Number(year),
      Number(month) - 1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    })
  }

  const fetchFees = async () => {
    try {
      setLoading(true)

      const teacherQuery =
        teacherFilter !== "all"
          ? `&teacherId=${teacherFilter}`
          : ""

      const response = await fetch(
        `http://localhost:3000/api/fees?billingMonth=${billingMonth}${teacherQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get fees")
      }

      setStudents(data.students)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const teacherQuery =
        teacherFilter !== "all"
          ? `&teacherId=${teacherFilter}`
          : ""

      const response = await fetch(
        `http://localhost:3000/api/fees/summary?billingMonth=${billingMonth}${teacherQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get fee summary")
      }

      setSummary(data.summary)
      setPaidStudents(data.paidStudents)
      setDueStudents(data.dueStudents)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/teachers",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get teachers")
      }

      setTeachers(data.teachers)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const loadFees = async () => {
    await Promise.all([
      fetchFees(),
      fetchSummary()
    ])
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    loadFees()
  }, [billingMonth, teacherFilter])

  const generateFees = async () => {
    try {
      setGenerating(true)
      setMessage("")

      const response = await fetch(
        "http://localhost:3000/api/fees/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            billingMonth
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate fees")
      }

      setMessage(`${data.generatedCount} fee records generated.`)

      await loadFees()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const openStudentFees = (studentId) => {
    navigate(
      `/fees/student/${studentId}?billingMonth=${billingMonth}`
    )
  }

  const filteredStudents = students.filter((student) => {
    const searchValue = search.toLowerCase().trim()

    const matchesSearch =
      student.studentId.toLowerCase().includes(searchValue) ||
      student.name.toLowerCase().includes(searchValue)

    const matchesStatus =
      statusFilter === "all" ||
      student.paymentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const collectionComplete =
    summary.totalNetFee > 0 &&
    summary.totalDue === 0

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading fees...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Wallet size={22} />Fees</h1>
          <p>Manage student monthly fees and collections.</p>
        </div>

        <button
          className="back-button"
          onClick={() =>
            navigate(
              sessionStorage.getItem("feesReturnPath") || "/",
              { replace: true }
            )
          }
        >
          <ChevronLeft size={17} aria-hidden="true" />
          Back
        </button>
      </div>

      <div className="fee-controls">
        <div>
          <label htmlFor="billingMonth">Billing Month</label>

          <input
            id="billingMonth"
            type="month"
            value={billingMonth}
            onChange={(event) => {
              setBillingMonth(event.target.value)
              setMessage("")
            }}
          />
        </div>

        <button
          className="primary-button"
          onClick={generateFees}
          disabled={generating}
        >
          <PlusCircle size={17} aria-hidden="true" />
          {generating ? "Generating..." : "Generate Fees"}
        </button>
      </div>

      {message && (
        <div className="fee-message">
          {message}
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-card-label">
            <ReceiptText size={18} aria-hidden="true" />
            Total Original Fee
          </span>
          <strong>{formatCurrency(summary.totalOriginalFee)}</strong>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">
            <IndianRupee size={18} aria-hidden="true" />
            Total Net Fee
          </span>
          <strong>{formatCurrency(summary.totalNetFee)}</strong>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">
            <UserCheck size={18} aria-hidden="true" />
            Fee Paid Students
          </span>
          <strong>{paidStudents}</strong>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">
            <UserRound size={18} aria-hidden="true" />
            Fee Due Students
          </span>
          <strong>{dueStudents}</strong>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">
            <Wallet size={18} aria-hidden="true" />
            Total Collection
          </span>

          <div className="collection-value">
            <strong>{formatCurrency(summary.totalCollection)}</strong>

            {collectionComplete && (
              <span className="full-tag">Full</span>
            )}
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-card-label">
            <CircleAlert size={18} aria-hidden="true" />
            Total Due
          </span>
          <strong>{formatCurrency(summary.totalDue)}</strong>
        </div>
      </div>

      <div className="fees-card">
        <div className="fees-card-header">
          <div>
            <h2>
              <ReceiptText size={19} aria-hidden="true" />
              Student Fees
            </h2>
            <p>{formatMonth(billingMonth)}</p>
          </div>

          <span className="fee-count">
            <Users size={15} aria-hidden="true" />
            {filteredStudents.length} students
          </span>
        </div>

        <div className="fee-filters">
          <div className="search-box">
            <label htmlFor="studentSearch">
              <Search size={15} aria-hidden="true" />
              Search Student
            </label>

            <input
              id="studentSearch"
              type="text"
              placeholder="Search by ID or name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
            />
          </div>

          <div className="teacher-filter">
            <label htmlFor="teacherFilter">
              <GraduationCap size={15} aria-hidden="true" />
              Teacher
            </label>

            <select
              id="teacherFilter"
              value={teacherFilter}
              onChange={(event) => {
                setTeacherFilter(event.target.value)
                setSearch("")
                setStatusFilter("all")
              }}
            >
              <option value="all">All Teachers</option>

              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          <div className="status-filter">
            <label htmlFor="statusFilter">
              <ChartNoAxesCombined size={15} aria-hidden="true" />
              Payment Status
            </label>

            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
              }}
            >
              <option value="all">All</option>
              <option value="paid">Full</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            No students found.
          </div>
        ) : (
          <div className="table-container">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>
                   
                    Total Subjects
                  </th>
                  <th>Original Fee</th>
                  <th>
                    <Percent size={15} aria-hidden="true" />
                    Discount
                  </th>
                  <th>Net Fee</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.studentId}
                    className="clickable-row"
                    onClick={() => openStudentFees(student.id)}
                  >
                    <td>
                      <strong>{student.studentId}</strong>
                      <span className="table-secondary">
                        {student.name}
                      </span>
                    </td>

                    <td>{student.totalSubjects}</td>
                    <td>{formatCurrency(student.originalFee)}</td>
                    <td>{student.discount}%</td>
                    <td>{formatCurrency(student.netFee)}</td>
                    <td>{formatCurrency(student.paidAmount)}</td>
                    <td>{formatCurrency(student.dueAmount)}</td>

                    <td>
                      <span className={`status ${student.paymentStatus}`}>
                        {student.paymentStatus === "paid"
                          ? "Full"
                          : student.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Fees