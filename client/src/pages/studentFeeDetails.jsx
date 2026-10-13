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

  const escapeHtml = (value) => {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const characters = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }

      return characters[character]
    })
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
      setLoading(false)
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
        subject: subject.subject,
        teacher: subject.teacher,
        currentDue: subject.dueAmount
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.paymentDate) -
        new Date(a.paymentDate)
    )

  const getReceiptNumber = (payment) => {
    const paymentId = payment._id || payment.id

    if (!paymentId) {
      return "Receipt ID unavailable"
    }

    return `SCMS-RCP-${paymentId}`
  }

  const printReceipt = (payment) => {
    const receiptNumber = getReceiptNumber(payment)

    if (receiptNumber === "Receipt ID unavailable") {
      setMessage("Cannot generate receipt: payment ID is missing.")
      return
    }

    const receiptWindow = window.open(
      "",
      "_blank",
      "width=900,height=750"
    )

    if (!receiptWindow) {
      setMessage("Please allow pop-ups to open the receipt.")
      return
    }

    const student = data.student
    const paymentDate = formatDate(payment.paymentDate)

    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(receiptNumber)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f3f4f6;
            color: #222;
            font-family: Arial, Helvetica, sans-serif;
          }

          .receipt {
            max-width: 760px;
            margin: 0 auto;
            padding: 38px;
            background: #fff;
            border: 1px solid #d8dee8;
          }

          .receipt-header {
            padding-bottom: 22px;
            border-bottom: 2px solid #253b65;
            text-align: center;
          }

          .receipt-header h1 {
            margin: 0 0 8px;
            color: #253b65;
            font-size: 26px;
          }

          .receipt-header p {
            margin: 5px 0;
            color: #555;
            font-size: 13px;
          }

          .receipt-title {
            margin: 25px 0;
            text-align: center;
            font-size: 19px;
            letter-spacing: 2px;
          }

          .receipt-meta {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 22px;
            font-size: 13px;
          }

          .section-title {
            margin: 22px 0 10px;
            color: #253b65;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          td {
            padding: 12px;
            border: 1px solid #d8dee8;
            font-size: 13px;
            overflow-wrap: anywhere;
          }

          td:first-child {
            width: 42%;
            background: #f8fafc;
            font-weight: 600;
          }

          .amount-row td {
            font-size: 16px;
            font-weight: 700;
          }

          .receipt-footer {
            margin-top: 30px;
            color: #666;
            font-size: 12px;
            line-height: 1.6;
            text-align: center;
          }

          .print-button {
            display: block;
            margin: 22px auto 0;
            padding: 11px 22px;
            border: 0;
            border-radius: 5px;
            background: #4b6276;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
          }

          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }

            body {
              padding: 0;
              background: #fff;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .receipt {
              max-width: none;
              padding: 10px;
              border: none;
            }

            .print-button {
              display: none;
            }
          }

          @media screen and (max-width: 600px) {
            body {
              padding: 10px;
            }

            .receipt {
              padding: 18px;
            }

            .receipt-meta {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <header class="receipt-header">
            <h1>Curiosity Classes</h1>
            <p>Smart Coaching Management System</p>
            <p>Ukilpara (Near Khelaghar School) Jalpaiguri, West Bengal. Mo- 7479116205</p>
          </header>

          <h2 class="receipt-title">PAYMENT RECEIPT</h2>

          <div class="receipt-meta">
            <div>
              <strong>Receipt No.:</strong>
              ${escapeHtml(receiptNumber)}
            </div>
            <div>
              <strong>Payment Date:</strong>
              ${escapeHtml(paymentDate)}
            </div>
          </div>

          <h3 class="section-title">Student Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Student ID</td>
                <td>${escapeHtml(student.studentId || student.id)}</td>
              </tr>
              <tr>
                <td>Student Name</td>
                <td>${escapeHtml(student.name)}</td>
              </tr>
              <tr>
                <td>Class</td>
                <td>${escapeHtml(student.className || "-")}</td>
              </tr>
            </tbody>
          </table>

          <h3 class="section-title">Payment Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Billing Month</td>
                <td>${escapeHtml(formatMonth(billingMonth))}</td>
              </tr>
              <tr>
                <td>Subject</td>
                <td>${escapeHtml(payment.subject)}</td>
              </tr>
              <tr>
                <td>Teacher</td>
                <td>${escapeHtml(payment.teacher || "-")}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>${escapeHtml(formatPaymentMethod(payment.paymentMethod))}</td>
              </tr>
              <tr class="amount-row">
                <td>Amount Received</td>
                <td>${escapeHtml(formatCurrency(payment.amount))}</td>
              </tr>
              <tr>
                <td>Remaining Due (Current)</td>
                <td>${escapeHtml(formatCurrency(payment.currentDue))}</td>
              </tr>
            </tbody>
          </table>

          <footer class="receipt-footer">
            <p>This receipt confirms the payment recorded in SCMS.</p>
            <p>Please keep this receipt for your records.</p>
          </footer>

          <button class="print-button" onclick="window.print()">
            Print / Save as PDF
          </button>
        </main>
      </body>
      </html>
    `

    receiptWindow.document.open()
    receiptWindow.document.write(receiptHtml)
    receiptWindow.document.close()
  }

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
          <h1>Fee Details :</h1>
          <p>{formatMonth(billingMonth)}</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate(-1)}
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
            {formatCurrency(data.totals.totalOriginalFee)}
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

          <span className={`status ${data.totals.paymentStatus}`}>
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
                <td>{formatCurrency(subject.originalFee)}</td>
                <td>{subject.discount}%</td>
                <td>{formatCurrency(subject.netFee)}</td>
                <td>{formatCurrency(subject.paidAmount)}</td>
                <td>{formatCurrency(subject.dueAmount)}</td>
                <td>
                  <span className={`status ${subject.paymentStatus}`}>
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
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>
              {paymentHistory.map((payment, index) => (
                <tr
                  key={
                    payment._id ||
                    payment.id ||
                    `${payment.paymentDate}-${index}`
                  }
                >
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>{payment.subject}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>
                    {formatPaymentMethod(payment.paymentMethod)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="receipt-button"
                      onClick={() => printReceipt(payment)}
                    >
                      Get Receipt
                    </button>
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
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
            >
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default StudentFeeDetails