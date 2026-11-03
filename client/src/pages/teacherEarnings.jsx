import { useEffect, useState } from "react"
import Sidebar from "../components/sidebar"
import "./teacherEarnings.css"
import { CircleDollarSign } from "lucide-react"

function TeacherEarnings() {
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")

    return `${year}-${month}`
  })

  const [earnings, setEarnings] = useState([])
  const [summary, setSummary] = useState({
    totalCollected: 0,
    teacherEarned: 0,
    commissionCut: 0
  })
  const [message, setMessage] = useState("")

  // Expense contribution states
  const [expenseHistory, setExpenseHistory] = useState([])
  const [expenseSummary, setExpenseSummary] = useState({
    totalAllocated: 0,
    totalPaid: 0,
    totalDue: 0,
    totalRefunded: 0,
    refundDue: 0
  })
  const [expenseMessage, setExpenseMessage] = useState("")

  // Fetch teacher earnings
  useEffect(() => {
    const getEarnings = async () => {
      const token = localStorage.getItem("token")

      try {
        const response = await fetch(
          `https://scms-backend-uhfo.onrender.com/api/teacher-earnings/me?billingMonth=${billingMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message || "Failed to get earnings")
          return
        }

        setEarnings(data.records || [])
        setSummary(data.summary || {
          totalCollected: 0,
          teacherEarned: 0,
          commissionCut: 0
        })
        setMessage("")
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getEarnings()
  }, [billingMonth])

  // Fetch teacher expense contributions
  useEffect(() => {
    const getExpenseContributions = async () => {
      const token = localStorage.getItem("token")

      try {
        const response = await fetch(
          `https://scms-backend-uhfo.onrender.com/api/expenses/my-contributions?month=${billingMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setExpenseMessage(
            data.message || "Failed to get expense contributions"
          )
          return
        }

       const history = data.history || []

setExpenseHistory(history)

setExpenseSummary({
  ...(data.summary || {}),
  totalAllocated: history.reduce(
    (total, expense) =>
      total + Number(expense.allocatedAmount || 0),
    0
  )
})
        setExpenseMessage("")
      } catch (error) {
        setExpenseMessage("Unable to load expense contributions")
      }
    }

    getExpenseContributions()
  }, [billingMonth])

  const formatMonth = (month) => {
    const [year, monthNumber] = month.split("-")
    const date = new Date(Number(year), Number(monthNumber) - 1)

    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    })
  }

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`

  const formatDate = (date) => {
    if (!date) return "—"

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "status-paid"

      case "partial":
        return "status-partial"

      case "due":
        return "status-due"

      case "cancelled":
        return "status-cancelled"

      default:
        return "status-default"
    }
  }

  // Display API errors only once below the page heading
  const pageMessage = message || expenseMessage

  return (
    <div className="teacher-earnings-layout">
      <Sidebar />

      <main className="teacher-earnings-content">
        <header className="teacher-earnings-header">
          <div>
            <h1>
              <CircleDollarSign size={22} />
              My Earnings
            </h1>

            <p>
              Billing Month: {formatMonth(billingMonth)}
            </p>

            {pageMessage && (
              <p className="teacher-earnings-message">
                {pageMessage}
              </p>
            )}
          </div>

          <div className="billing-month">
            <label htmlFor="billingMonth">
              Billing Month
            </label>

            <input
              id="billingMonth"
              type="month"
              value={billingMonth}
              onChange={(event) =>
                setBillingMonth(event.target.value)
              }
            />
          </div>
        </header>

        {/* Earnings Summary */}
        <section className="earnings-summary">
          <div className="earning-card">
            <h3>Total Collected</h3>
            <p>{formatCurrency(summary.totalCollected)}</p>
          </div>

          <div className="earning-card">
            <h3>My Earnings</h3>
            <p>{formatCurrency(summary.teacherEarned)}</p>
          </div>

          <div className="earning-card">
            <h3>Commission Cut</h3>
            <p>{formatCurrency(summary.commissionCut)}</p>
          </div>
        </section>

        {/* Earning Details */}
        <section className="earning-details">
          <h2>Earning Details</h2>

          {earnings.length === 0 ? (
            <p>No earning records found for this month.</p>
          ) : (
            <div className="earning-table-wrapper">
              <table className="earning-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Commission</th>
                    <th>Earned</th>
                  </tr>
                </thead>

                <tbody>
                  {earnings.map((earning) => (
                    <tr key={earning.id}>
                      <td>
                        {earning.studentId} - {earning.student}
                      </td>

                      <td>{earning.subject}</td>

                      <td>{earning.commission}%</td>

                      <td>
                        {formatCurrency(earning.teacherEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Expense Contributions */}
        <section className="earning-details expense-contribution-section">
          <h2>Expense Summary</h2>

          {/* Expense Summary - Five Cards */}
          <div className="earnings-summary expense-summary">
            <div className="earning-card">
              <h3>Total Allocated</h3>
              <p>{formatCurrency(expenseSummary.totalAllocated)}</p>
            </div>

            <div className="earning-card">
              <h3>Total Paid</h3>
              <p>{formatCurrency(expenseSummary.totalPaid)}</p>
            </div>

            <div className="earning-card">
              <h3>Total Due</h3>
              <p>{formatCurrency(expenseSummary.totalDue)}</p>
            </div>

            <div className="earning-card">
              <h3>Total Refunded</h3>
              <p>{formatCurrency(expenseSummary.totalRefunded)}</p>
            </div>

            <div className="earning-card">
              <h3>Refund Due</h3>
              <p>{formatCurrency(expenseSummary.refundDue)}</p>
            </div>
          </div>

          {/* Expense Table */}
          {expenseHistory.length === 0 ? (
            <p>No expense found for this month.</p>
          ) : (
            <div className="earning-table-wrapper">
              <table className="earning-table expense-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Allocation</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Refunded</th>
                    <th>Refund Due</th>
                    <th>Expense Status</th>
                  </tr>
                </thead>

                <tbody>
                  {expenseHistory.map((expense, index) => (
                    <tr key={expense.expenseId || index}>
                     

                      <td>
                        <strong>{expense.category || "—"}</strong>

                        {expense.description && (
                          <div className="table-secondary">
                            {expense.description}
                          </div>
                        )}
                      </td>

                      <td>
                        {formatCurrency(expense.amount)}
                      </td>

                      <td>
                        {formatCurrency(expense.allocatedAmount)}
                      </td>

                      <td>
                        {formatCurrency(expense.paidAmount)}
                      </td>

                      <td>
                        {formatCurrency(expense.dueAmount)}
                      </td>

                      <td>
                        {formatCurrency(expense.refundAmount)}
                      </td>

                      <td>
                        {formatCurrency(expense.refundDue)}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            expense.isCancelled
                              ? "status-cancelled"
                              : "status-active"
                          }`}
                        >
                          {expense.isCancelled ? "Cancelled" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default TeacherEarnings