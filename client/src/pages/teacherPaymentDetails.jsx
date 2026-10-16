import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ChevronLeft,
  ReceiptText,
  IndianRupee,
  Wallet,
  Building2,
  CircleCheck,
  Clock,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Percent,
  Users,
  CreditCard,
  Banknote,
  ClipboardList,
  FileText,
  Eye
} from "lucide-react"
import "./teacherPaymentDetails.css"

function TeacherPaymentDetails() {
  const navigate = useNavigate()
  const { teacherId } = useParams()
  const [searchParams] = useSearchParams()

  const [billingMonth, setBillingMonth] = useState(
    searchParams.get("billingMonth") ||
      new Date().toISOString().slice(0, 7)
  )

  const [teacher, setTeacher] = useState(null)
  const [earnings, setEarnings] = useState([])
  const [payments, setPayments] = useState([])

  const [totals, setTotals] = useState({
    totalCollected: 0,
    totalEarned: 0,
    totalCenterEarned: 0,
    totalPaid: 0,
    payable: 0
  })

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [note, setNote] = useState("")

  const [loading, setLoading] = useState(true)
  const [savingPayment, setSavingPayment] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

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

  const formatDate = (value) => {
    if (!value) {
      return "-"
    }

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true)
      setError("")
      setMessage("")

      const response = await fetch(
        `https://scms-backend-uhfo.onrender.com/api/teacher-payments/${teacherId}?billingMonth=${billingMonth}`,
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
            "Failed to get teacher payment details"
        )
      }

      setTeacher(data.teacher)
      setEarnings(data.earnings)
      setPayments(data.payments)
      setTotals(data.totals)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeacherDetails()
  }, [teacherId, billingMonth])

  const handleRecordPayment = async (event) => {
    event.preventDefault()

    const amount = Number(paymentAmount)

    if (!amount || amount <= 0) {
      setError("Enter a valid payment amount.")
      return
    }

    if (amount > totals.payable) {
      setError(
        `Payment cannot be more than the payable amount of ${formatCurrency(
          totals.payable
        )}.`
      )
      return
    }

    try {
      setSavingPayment(true)
      setError("")
      setMessage("")

      const response = await fetch(
        `https://scms-backend-uhfo.onrender.com/api/teacher-payments/${teacherId}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            billingMonth,
            amount,
            paymentMethod,
            note
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to record teacher payment"
        )
      }

      setMessage("Teacher payment recorded successfully.")
      setPaymentAmount("")
      setPaymentMethod("cash")
      setNote("")

      await fetchTeacherDetails()
    } catch (error) {
      setError(error.message)
    } finally {
      setSavingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="teacher-payment-details-page">
        <p>Loading teacher payment details...</p>
      </div>
    )
  }

  if (error && !teacher) {
    return (
      <div className="teacher-payment-details-page">
        <div className="details-error">
          {error}
        </div>

        <button
          className="details-back-button"
          onClick={() =>
            navigate("/teacher-payments", {
              replace: true
            })
          }
        >
          <ChevronLeft size={17} />
          Back to Teacher Payments
        </button>
      </div>
    )
  }

  return (
    <div className="teacher-payment-details-page">
      <div className="details-header">
        <div>
          <h1>Teacher Payment Details</h1>

          {teacher && (
            <p>
              <strong>{teacher.teacherId}</strong>{" "}
              — {teacher.name}
            </p>
          )}
        </div>

        <button
          className="details-back-button"
          onClick={() =>
            navigate("/teacher-payments", {
              replace: true
            })
          }
        >
          <ChevronLeft size={17} />
          Back
        </button>
      </div>

      <div className="details-controls">
        <div>
          <label htmlFor="billingMonth">
            <CalendarDays size={16} />
            Billing Month
          </label>

          <input
            id="billingMonth"
            type="month"
            value={billingMonth}
            onChange={(event) => {
              setBillingMonth(event.target.value)
              setError("")
              setMessage("")
            }}
          />
        </div>

        <div className="selected-month">
          <CalendarDays size={16} />
          {formatMonth(billingMonth)}
        </div>
      </div>

      {message && (
        <div className="details-message">
          <CircleCheck size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="details-error">
          {error}
        </div>
      )}

      <div className="teacher-payment-summary">
        <div className="teacher-payment-summary-card">
          <span className="teacher-payment-summary-label">
            <IndianRupee size={18} />
            Student Collection
          </span>
          <strong>{formatCurrency(totals.totalCollected)}</strong>
        </div>

        <div className="teacher-payment-summary-card">
          <span className="teacher-payment-summary-label">
            <Wallet size={18} />
            Teacher Earned
          </span>
          <strong>{formatCurrency(totals.totalEarned)}</strong>
        </div>

        <div className="teacher-payment-summary-card">
          <span className="teacher-payment-summary-label">
            <Building2 size={18} />
            Center Earned
          </span>
          <strong>{formatCurrency(totals.totalCenterEarned)}</strong>
        </div>

        <div className="teacher-payment-summary-card">
          <span className="teacher-payment-summary-label">
            <CircleCheck size={18} />
            Paid to Teacher
          </span>
          <strong>{formatCurrency(totals.totalPaid)}</strong>
        </div>

        <div className="teacher-payment-summary-card">
          <span className="teacher-payment-summary-label">
            <Clock size={18} />
            Teacher Payable
          </span>
          <strong>{formatCurrency(totals.payable)}</strong>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-section earnings-section">
          <div className="details-section-header">
            <div>
              <h2>
                <ReceiptText size={19} />
                Earning Details
              </h2>
              <p>
                Earnings generated from student fee collections.
              </p>
            </div>
          </div>

          {earnings.length === 0 ? (
            <div className="details-empty">
              No teacher earnings found for this month.
            </div>
          ) : (
            <div className="details-table-container">
              <table className="details-table">
                <thead>
                  <tr>
                    <th><Users size={15} /> Student</th>
                    <th><BookOpen size={15} /> Subject</th>
                    <th><IndianRupee size={15} /> Collection</th>
                    <th><Percent size={15} /> Commission</th>
                    <th><Wallet size={15} /> Teacher Earned</th>
                    <th><Building2 size={15} /> Center Earned</th>
                    <th><CalendarDays size={15} /> Date</th>
                  </tr>
                </thead>

                <tbody>
                  {earnings.map((earning) => (
                    <tr key={earning.id}>
                      <td>
                        <strong>{earning.studentId}</strong>
                        <span className="details-secondary">
                          {earning.student}
                        </span>
                      </td>
                      <td>{earning.subject}</td>
                      <td>{formatCurrency(earning.collectedAmount)}</td>
                      <td>{earning.commission}%</td>
                      <td>{formatCurrency(earning.teacherEarned)}</td>
                      <td>{formatCurrency(earning.centerEarned)}</td>
                      <td>{formatDate(earning.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="details-section payment-form-section">
          <div className="details-section-header">
            <div>
              <h2>
                <CreditCard size={19} />
                Record Payment
              </h2>
              <p>Record money paid to this teacher.</p>
            </div>
          </div>

          <form
            className="teacher-payment-form"
            onSubmit={handleRecordPayment}
          >
            <div className="form-group">
              <label htmlFor="paymentAmount">
                <IndianRupee size={15} />
                Payment Amount
              </label>

              <input
                id="paymentAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(event) => {
                  setPaymentAmount(event.target.value)
                  setError("")
                }}
              />

              <span className="form-hint">
                Payable: {formatCurrency(totals.payable)}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">
                <Banknote size={15} />
                Payment Method
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value)
                }}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentNote">
                <FileText size={15} />
                Note
              </label>

              <textarea
                id="paymentNote"
                rows="4"
                placeholder="Optional note"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value)
                }}
              />
            </div>

            <button
              type="submit"
              className="record-payment-button"
              disabled={savingPayment || totals.payable <= 0}
            >
              {savingPayment ? (
                "Recording..."
              ) : (
                <>
                  <CircleCheck size={17} />
                  Record Payment
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="details-section payment-history-section">
        <div className="details-section-header">
          <div>
            <h2>
              <ClipboardList size={19} />
              Payment History
            </h2>
            <p>
              Payments made to this teacher during{" "}
              {formatMonth(billingMonth)}.
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="details-empty">
            No payments have been recorded for this month.
          </div>
        ) : (
          <div className="details-table-container">
            <table className="details-table">
              <thead>
                <tr>
                  <th><CalendarDays size={15} /> Payment Date</th>
                  <th><IndianRupee size={15} /> Amount</th>
                  <th><CreditCard size={15} /> Payment Method</th>
                  <th><FileText size={15} /> Note</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>
                      {payment.paymentMethod === "bank_transfer"
                        ? "Bank Transfer"
                        : payment.paymentMethod
                            .toUpperCase()
                            .replace("_", " ")}
                    </td>
                    <td>{payment.note || "-"}</td>
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

export default TeacherPaymentDetails