import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./teacherPayments.css"

function TeacherPayments() {
  const navigate = useNavigate()

  const [billingMonth, setBillingMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7)
  })

  const [teachers, setTeachers] = useState([])

  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalTeacherEarned: 0,
    totalCenterEarned: 0,
    totalPaid: 0,
    totalPayable: 0
  })

  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

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

  const fetchTeacherPayments = async () => {
    try {
      setLoading(true)
      setMessage("")

      const response = await fetch(
        `http://localhost:3000/api/teacher-payments?billingMonth=${billingMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to get teacher payments"
        )
      }

      setTeachers(data.teachers)
      setSummary(data.summary)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeacherPayments()
  }, [billingMonth])

  const filteredTeachers = teachers.filter(
    (teacher) => {
      const searchValue =
        search.toLowerCase().trim()

      return (
        teacher.teacherId
          .toLowerCase()
          .includes(searchValue) ||
        teacher.name
          .toLowerCase()
          .includes(searchValue)
      )
    }
  )

  const openTeacherDetails = (teacherId) => {
    navigate(
      `/teacher-payments/${teacherId}?billingMonth=${billingMonth}`
    )
  }

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading teacher payments...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Teacher Payments</h1>

          <p>
            Manage teacher earnings and payments.
          </p>
        </div>

         <button
  className="back-button"
  onClick={() =>
    navigate(
      sessionStorage.getItem("teacherPaymentsReturnPath") || "/teachers",
      { replace: true }
    )
  }
>
  Back
</button>
      </div>

      <div className="payment-controls">
        <div>
          <label htmlFor="billingMonth">
            Billing Month
          </label>

          <input
            id="billingMonth"
            type="month"
            value={billingMonth}
            onChange={(event) => {
              setBillingMonth(event.target.value)
              setSearch("")
              setMessage("")
            }}
          />
        </div>
      </div>

      {message && (
        <div className="payment-message">
          {message}
        </div>
      )}

      <div className="teacher-summary-grid">
        <div className="teacher-summary-card">
          <span>Total Student Collection</span>

          <strong>
            {formatCurrency(
              summary.totalCollected
            )}
          </strong>
        </div>

        <div className="teacher-summary-card">
          <span>Total Teacher Earned</span>

          <strong>
            {formatCurrency(
              summary.totalTeacherEarned
            )}
          </strong>
        </div>

        <div className="teacher-summary-card">
          <span>Total Center Earned</span>

          <strong>
            {formatCurrency(
              summary.totalCenterEarned
            )}
          </strong>
        </div>

        <div className="teacher-summary-card">
          <span>Total Paid to Teachers</span>

          <strong>
            {formatCurrency(
              summary.totalPaid
            )}
          </strong>
        </div>

        <div className="teacher-summary-card">
          <span>Total Teacher Payable</span>

          <strong>
            {formatCurrency(
              summary.totalPayable
            )}
          </strong>
        </div>
      </div>

      <div className="payments-card">
        <div className="payments-card-header">
          <div>
            <h2>Teacher Payments</h2>

            <p>
              {formatMonth(billingMonth)}
            </p>
          </div>

          <span className="teacher-count">
            {filteredTeachers.length} teachers
          </span>
        </div>

        <div className="payment-filters">
          <div className="search-box">
            <label htmlFor="teacherSearch">
              Search Teacher
            </label>

            <input
              id="teacherSearch"
              type="text"
              placeholder="Search by ID or name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
            />
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="empty-state">
            No teacher payment records found.
          </div>
        ) : (
          <div className="table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Total Earned</th>
                  <th>Total Paid</th>
                  <th>Payable</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.map(
                  (teacher) => (
                    <tr key={teacher.teacherId}>
                      <td>
                        <strong>
                          {teacher.teacherId}
                        </strong>

                        <span className="table-secondary">
                          {teacher.name}
                        </span>
                      </td>

                      <td>
                        {formatCurrency(
                          teacher.totalEarned
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          teacher.totalPaid
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          teacher.payable
                        )}
                      </td>

                      <td>
                        <button
                          className="view-button"
                          onClick={() =>
                            openTeacherDetails(
                              teacher.id
                            )
                          }
                        >
                          Pay | View 👁️
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherPayments