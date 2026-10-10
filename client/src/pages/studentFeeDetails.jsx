import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import "./studentFeeDetails.css"

function StudentFeeDetails() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [data, setData] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const token = localStorage.getItem("token")

  const billingMonth =
    searchParams.get("billingMonth") ||
    new Date().toISOString().slice(0, 7)

  const isAdmin = role === "admin"
  const isStudent = role === "student"

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatMonth = (value) => {
    if (!value) return ""

    const [year, month] = value.split("-")

    return new Date(
      Number(year),
      Number(month) - 1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    })
  }

  const formatDate = (value) => {
    if (!value) return "-"

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const formatPaymentMethod = (value) => {
    const methods = {
      cash: "Cash",
      upi: "UPI",
      bank_transfer: "Bank Transfer",
      card: "Card",
      other: "Other"
    }

    return methods[value] || value
  }

  const getUserRole = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to get user information"
        )
      }

      setRole(result.user.role)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const fetchStudentFees = async () => {
    try {
      setLoading(true)

      const url = isStudent
        ? `http://localhost:3000/api/fees/student/me?billingMonth=${billingMonth}`
        : `http://localhost:3000/api/fees/student/${studentId}?billingMonth=${billingMonth}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to get student fees"
        )
      }

      setData(result)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserRole()
  }, [])

  useEffect(() => {
    if (role) {
      fetchStudentFees()
    }
  }, [role, studentId, billingMonth])

  const recordPayment = async (event) => {
    event.preventDefault()

    const amount = Number(paymentAmount)

    if (!amount || amount <= 0) {
      setMessage("Enter a valid payment amount.")
      return
    }

    if (amount > data.totals.totalDue) {
      setMessage(
        "Payment cannot be more than the due amount."
      )
      return
    }

    try {
      setSaving(true)
      setMessage("")

      const response = await fetch(
        `http://localhost:3000/api/fees/student/${studentId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            billingMonth,
            amount,
            paymentMethod
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to record payment"
        )
      }

      setPaymentAmount("")
      setPaymentMethod("cash")
      setMessage("Payment recorded successfully.")

      await fetchStudentFees()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const paymentHistory = data?.subjects
    ?.flatMap((subject) =>
      (subject.payments || []).map((payment) => ({
        ...payment,
        subject: subject.subject
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.paymentDate) -
        new Date(a.paymentDate)
    )

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading fee details...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="fee-message">
          {message || "No fee data found."}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-group">
          <h1>Fee Details : </h1>
          <p>{formatMonth(billingMonth)}</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/fees", { replace: true })}
         >
           Back
        </button>
      </div>
      <div className="student-fee-card">
        <div className="student-info-row">
          <div>
           <strong>Student ID: </strong>
           <span>{data.student.studentId}</span>
         </div>

         <div>
           <strong>Name: </strong>
           <span>{data.student.name}</span>
         </div>
         <div>
           <strong>Class: </strong>
           <span>{data.student.className}</span>
         </div>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <span>Original Fee</span>
          <strong>
            {formatCurrency(
              data.totals.totalOriginalFee
            )}
          </strong>
        </div>

        <div className="summary-card">
          <span>Net Fee</span>
          <strong>
            {formatCurrency(data.totals.totalNetFee)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Paid</span>
          <strong>
            {formatCurrency(data.totals.totalPaid)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Due</span>
          <strong>
            {formatCurrency(data.totals.totalDue)}
          </strong>
        </div>
      </div>

      {message && (
        <div className="fee-message">
          {message}
        </div>
      )}

      <div className="student-fee-card">
        <div className="card-header">
          <div>
            <h2>Subject-wise Fees</h2>
            <p>{formatMonth(billingMonth)}</p>
          </div>

          <span
            className={`status ${data.totals.paymentStatus}`}
          >
            {data.totals.paymentStatus}
          </span>
        </div>

        <table className="fees-table">
          <thead>
            <tr>
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
            {data.subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.subject}</td>
                <td>{subject.teacher}</td>
                <td>
                  {formatCurrency(subject.originalFee)}
                </td>
                <td>{subject.discount}%</td>
                <td>
                  {formatCurrency(subject.netFee)}
                </td>
                <td>
                  {formatCurrency(subject.paidAmount)}
                </td>
                <td>
                  {formatCurrency(subject.dueAmount)}
                </td>
                <td>
                  <span
                    className={`status ${subject.paymentStatus}`}
                  >
                    {subject.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paymentHistory?.length > 0 && (
        <div className="student-fee-card">
          <div className="card-header">
            <div>
              <h2>Payment History</h2>
              <p>Payments recorded for this month</p>
            </div>
          </div>

          <table className="fees-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>

            <tbody>
              {paymentHistory.map((payment, index) => (
                <tr key={`${payment.paymentDate}-${index}`}>
                  <td>
                    {formatDate(payment.paymentDate)}
                  </td>

                  <td>{payment.subject}</td>

                  <td>
                    {formatCurrency(payment.amount)}
                  </td>

                  <td>
                    {formatPaymentMethod(
                      payment.paymentMethod
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && data.totals.totalDue > 0 && (
        <div className="payment-card">
          <h2>Record Payment</h2>

          <form onSubmit={recordPayment}>
            <div>
              <label>Payment Amount</label>

              <input
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(event.target.value)
                }
                placeholder="Enter payment amount"
              />
            </div>

            <div>
              <label>Payment Method</label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Recording..."
                : "Record Payment"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default StudentFeeDetails