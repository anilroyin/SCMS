
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Wallet,
  Users,
  TrendingUp,
  Receipt,
  X,
  RefreshCw,
  BriefcaseBusiness,
  ChevronLeft
} from "lucide-react"
import Sidebar from "../components/sidebar"
import "./finances.css"

const API = "https://scms-backend-uhfo.onrender.com/api"
const SESSION_START = "2026-04"

const money = value =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const getPaymentMethodLabel = method => {
  const labels = {
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    other: "Other"
  }

  const key = String(method || "").toLowerCase()
  return labels[key] || (method ? String(method) : "Unknown")
}

const getMonthLabel = month => {
  const [year, number] = month.split("-").map(Number)

  return new Date(year, number - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  })
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const getFinancialYear = month => {
  const [year, number] = month.split("-").map(Number)
  return number >= 4 ? year : year - 1
}

const getFinancialMonths = year =>
  Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, 3 + index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })

function Finances() {
  const navigate = useNavigate()

  const [billingMonth, setBillingMonth] = useState(getCurrentMonth())
  const [monthly, setMonthly] = useState({})
  const [annual, setAnnual] = useState({})
  const [expenses, setExpenses] = useState([])
  const [contributionExpenses, setContributionExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [paymentAmounts, setPaymentAmounts] = useState({})
  const [paymentMethods, setPaymentMethods] = useState({})
  const [selectedCancelledExpense, setSelectedCancelledExpense] = useState(null)
  const [refundAmounts, setRefundAmounts] = useState({})
  const [refundMethods, setRefundMethods] = useState({})
  const [refundSaving, setRefundSaving] = useState({})

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
    paidBy: "teachers"
  })

  const financialYear = getFinancialYear(billingMonth)

  const request = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.")
    }

    return data
  }, [])

  const loadFinance = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const months = getFinancialMonths(financialYear)

      const monthlyResults = await Promise.all(
        months.map(async month => {
          const [feeData, paymentData] = await Promise.all([
            request(`/fees/summary?billingMonth=${month}`),
            request(`/teacher-payments?billingMonth=${month}`)
          ])

          return {
            month,
            business: Number(feeData.summary?.totalCollection || 0),
            dues: Number(feeData.summary?.totalDue || 0),
            teacherPaid: Number(paymentData.summary?.totalPaid || 0),
            centreEarnings: Number(paymentData.summary?.totalCenterEarned || 0)
          }
        })
      )

      const selectedMonth = monthlyResults.find(
        item => item.month === billingMonth
      ) || {
        business: 0,
        dues: 0,
        teacherPaid: 0,
        centreEarnings: 0
      }

      const [expenseSummary, expenseList, yearExpenses] = await Promise.all([
        request(`/expenses/summary?financialYear=${financialYear}`),
        request(`/expenses?month=${billingMonth}&includeCancelled=true`),
        request(`/expenses?financialYear=${financialYear}&includeCancelled=true`)
      ])

      const totals = monthlyResults.reduce((result, item) => ({
        business: result.business + item.business,
        dues: result.dues + item.dues,
        teacherPaid: result.teacherPaid + item.teacherPaid,
        centreEarnings: result.centreEarnings + item.centreEarnings
      }), {
        business: 0,
        dues: 0,
        teacherPaid: 0,
        centreEarnings: 0
      })

      setMonthly(selectedMonth)

      setAnnual({
        ...totals,
        expenses: Number(expenseSummary.totalExpenses || 0),
        expenseReceived: Number(expenseSummary.totalContributionsPaid || 0),
        expenseDue: Number(expenseSummary.totalContributionDue || 0)
      })

      setExpenses(Array.isArray(expenseList) ? expenseList : [])
      setContributionExpenses(Array.isArray(yearExpenses) ? yearExpenses : [])
    } catch (err) {
      setError(err.message || "Unable to load financial data.")
    } finally {
      setLoading(false)
    }
  }, [billingMonth, financialYear, request])

  useEffect(() => {
    loadFinance()
  }, [loadFinance])

  // Automatically dismiss success messages after 2.5 seconds.
  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      setMessage("")
    }, 2500)

    return () => clearTimeout(timer)
  }, [message])

  const handleCreateExpense = async event => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      await request("/expenses", {
        method: "POST",
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount)
        })
      })

      setExpenseForm({
        category: "",
        amount: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        description: "",
        paidBy: "teachers"
      })

      setShowExpenseForm(false)
      setMessage("Expense recorded successfully.")
      await loadFinance()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelExpense = async expenseId => {
    const reason = window.prompt("Enter the reason for cancelling this expense:")

    if (reason === null) return

    if (!reason.trim()) {
      setError("A cancellation reason is required.")
      return
    }

    setError("")
    setMessage("")

    try {
      const result = await request(`/expenses/${expenseId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ cancelReason: reason.trim() })
      })

      setMessage(result.message || "Expense cancelled.")
      await loadFinance()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleContributionPayment = async teacher => {
    const key = teacher.id
    const amount = Number(paymentAmounts[key] || 0)

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > teacher.due
    ) {
      setError(
        `Enter a payment amount from ${money(0.01)} to ${money(teacher.due)}.`
      )
      return
    }

    setError("")
    setMessage("")

    try {
      await request(`/expenses/contributions/${teacher.id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          paymentMethod: paymentMethods[key] || "cash"
        })
      })

      setPaymentAmounts(previous => ({ ...previous, [key]: "" }))
      setMessage("Teacher contribution recorded.")
      await loadFinance()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleTeacherRefund = async (expense, allocation) => {
    const teacher = allocation.teacherId
    const key = `${expense._id}-${teacher._id}`
    const amount = Number(refundAmounts[key] || 0)

    const alreadyRefunded = (allocation.refunds || []).reduce(
      (total, refund) => total + Number(refund.amount || 0),
      0
    )

    const refundDue = Math.max(
      0,
      Number(allocation.paidAmount || 0) - alreadyRefunded
    )

    if (!Number.isFinite(amount) || amount <= 0 || amount > refundDue) {
      setError(
        `Enter a refund amount from ${money(0.01)} to ${money(refundDue)}.`
      )
      return
    }

    setRefundSaving(previous => ({ ...previous, [key]: true }))
    setError("")
    setMessage("")

    try {
      await request(
        `/expenses/${expense._id}/contributions/${teacher._id}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            amount,
            paymentMethod: refundMethods[key] || "cash"
          })
        }
      )

      setRefundAmounts(previous => ({ ...previous, [key]: "" }))
      setMessage("Teacher refund recorded.")
      await loadFinance()

      const updatedExpenses = await request(
        `/expenses?month=${billingMonth}&includeCancelled=true`
      )

      const updatedExpense = updatedExpenses.find(
        item => item._id === expense._id
      )

      setSelectedCancelledExpense(updatedExpense || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setRefundSaving(previous => ({ ...previous, [key]: false }))
    }
  }

  const teacherContributions = {}

  contributionExpenses.forEach(expense => {
    if (expense.paidBy === "centre" || expense.isCancelled) return

    ;(expense.allocations || []).forEach(allocation => {
      const teacher = allocation.teacherId
      if (!teacher?._id) return

      const id = teacher._id

      if (!teacherContributions[id]) {
        teacherContributions[id] = {
          id,
          name: teacher.name,
          teacherId: teacher.teacherId,
          allocated: 0,
          paid: 0,
          due: 0,
          paymentMethods: []
        }
      }

      const row = teacherContributions[id]
      const allocated = Number(allocation.allocatedAmount || 0)
      const paid = Number(allocation.paidAmount || 0)
      const advanceApplied = Number(allocation.advanceApplied || 0)
      const reversedAmount = Number(allocation.reversedAmount || 0)
      const due = Math.max(
        0,
        allocated - paid - advanceApplied - reversedAmount
      )

      row.allocated += allocated
      row.paid += paid
      row.due += due

      // Preserve the actual methods used across all recorded payments.
      ;(allocation.payments || []).forEach(payment => {
        if (payment.paymentMethod) {
          const label = getPaymentMethodLabel(payment.paymentMethod)
          if (!row.paymentMethods.includes(label)) {
            row.paymentMethods.push(label)
          }
        }
      })
    })
  })

  const contributionRows = Object.values(teacherContributions)

  const availableMonths = []
  const [startYear, startMonth] = SESSION_START.split("-").map(Number)
  const startDate = new Date(startYear, startMonth - 1, 1)
  const endDate = new Date()
  endDate.setDate(1)

  for (
    let date = new Date(endDate);
    date >= startDate;
    date.setMonth(date.getMonth() - 1)
  ) {
    availableMonths.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    )
  }

  const monthlyCards = [
    { label: "Fee collected", value: monthly.business, icon: Wallet },
    { label: "Fee Dues", value: monthly.dues, icon: Receipt },
    { label: "Teacher Paid", value: monthly.teacherPaid, icon: Users },
    { label: "Centre Earnings", value: monthly.centreEarnings, icon: TrendingUp }
  ]

  const annualCards = [
    { label: "Total Business", value: annual.business },
    { label: "Fee Dues", value: annual.dues },
    { label: "Total Paid to Teachers", value: annual.teacherPaid },
    { label: "Total Centre Earnings", value: annual.centreEarnings },
    { label: "Total Expenses", value: annual.expenses },
    { label: "Teacher Contributions Received", value: annual.expenseReceived },
    { label: "Teacher Contribution Due", value: annual.expenseDue },
    {
      label: "Net Centre Earnings",
      // Expenses paid by teachers should not reduce centre earnings twice.
      // Contributions received offset the teacher-paid expense allocation.
      value: Number(annual.centreEarnings || 0) -
        Number(annual.expenses || 0) +
        Number(annual.expenseReceived || 0)
    }
  ]

  if (loading) {
    return (
      <div className="finances-layout">
        <Sidebar />
        <main className="page-container finances-page">
          <p>Loading finances...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="finances-layout">
      <Sidebar />

      <main className="page-container finances-page">
        <div className="page-header">
          <div>
            <h1><BriefcaseBusiness size={22} /> Finances</h1>
            <p>Monitor collections, teacher payments, centre earnings and expenses.</p>
          </div>

          <button
            className="back-button"
            onClick={() => {
              const returnPath = sessionStorage.getItem("financesReturnPath")
              if (returnPath) {
                navigate(returnPath, { replace: true })
              } else {
                navigate(-1)
              }
            }}
            type="button"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>

        {error && <div className="payment-message error">{error}</div>}
        {message && <div className="payment-message success">{message}</div>}

        <section className="finances-section">
          <div className="finances-section-header">
            <div>
              <h2>Monthly Overview</h2>
              <p>Financial activity for the selected month.</p>
            </div>

            <select
              value={billingMonth}
              onChange={event => setBillingMonth(event.target.value)}
              aria-label="Billing month"
            >
              {availableMonths.map(month => (
                <option value={month} key={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>

          <div className="finance-summary-grid">
            {monthlyCards.map(({ label, value, icon: Icon }) => (
              <div className="finance-summary-card" key={label}>
                <div className="finance-summary-icon">
                  <Icon size={20} />
                </div>
                <span className="finance-summary-label">{label}</span>
                <strong>{money(value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="finances-section">
          <div className="finances-section-header">
            <div>
              <h2>Annual Overview</h2>
              <p>Accumulated totals for the financial year.</p>
            </div>
            <span className="finance-year-label">
              FY {financialYear}–{String(financialYear + 1).slice(-2)}
            </span>
          </div>

          <div className="finance-summary-grid">
            {annualCards.map(({ label, value }) => (
              <div className="finance-summary-card" key={label}>
                <span className="finance-summary-label">{label}</span>
                <strong>{money(value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="finances-section">
          <div className="finances-section-header">
            <div>
              <h2>Monthly Expenses</h2>
              <p>Record centre costs and track teacher contributions.</p>
            </div>

            <button
              type="button"
              className="finance-primary-button"
              onClick={() => setShowExpenseForm(value => !value)}
            >
              {showExpenseForm ? <X size={16} /> : <Plus size={16} />}
              {showExpenseForm ? "Close" : "Add Expense"}
            </button>
          </div>

          {showExpenseForm && (
            <form className="finance-expense-form" onSubmit={handleCreateExpense}>
              <div className="finance-form-grid">
                <label>
                  Category
                  <input
                    value={expenseForm.category}
                    onChange={event =>
                      setExpenseForm({
                        ...expenseForm,
                        category: event.target.value
                      })
                    }
                    required
                    maxLength={100}
                    placeholder="e.g. Electricity"
                  />
                </label>

                <label>
                  Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={event =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: event.target.value
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Expense Date
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={event =>
                      setExpenseForm({
                        ...expenseForm,
                        expenseDate: event.target.value
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Paid By
                  <select
                    value={expenseForm.paidBy}
                    onChange={event =>
                      setExpenseForm({
                        ...expenseForm,
                        paidBy: event.target.value
                      })
                    }
                    required
                  >
                    <option value="teachers">Shared by teachers</option>
                    <option value="centre">Centre pays</option>
                  </select>
                </label>

                <label className="finance-description-field">
                  Description
                  <input
                    value={expenseForm.description}
                    onChange={event =>
                      setExpenseForm({
                        ...expenseForm,
                        description: event.target.value
                      })
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <button
                className="finance-primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </form>
          )}

          <div className="table-container">
            <table className="finances-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Paid By</th>
                  <th>Amount</th>
                  <th>Teachers</th>
                  <th>Contribution Due</th>
                  <th>Status / Action</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map(expense => {
                  const due = expense.paidBy === "centre"
                    ? 0
                    : (expense.allocations || []).reduce(
                      (sum, allocation) =>
                        sum + Math.max(
                          0,
                          Number(allocation.allocatedAmount || 0) -
                          Number(allocation.paidAmount || 0) -
                          Number(allocation.advanceApplied || 0) -
                          Number(allocation.reversedAmount || 0)
                        ),
                      0
                    )

                  const teachersToRefund = (expense.allocations || []).filter(
                    allocation => Number(allocation.paidAmount || 0) > 0
                  )

                  const allRefunded = teachersToRefund.length > 0 &&
                    teachersToRefund.every(allocation => {
                      const refunded = (allocation.refunds || []).reduce(
                        (total, refund) =>
                          total + Number(refund.amount || 0),
                        0
                      )

                      return refunded >= Number(allocation.paidAmount || 0)
                    })

                  return (
                    <tr key={expense._id}>
                      <td>
                        {new Date(expense.expenseDate).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <strong>{expense.category}</strong>
                        {expense.description && (
                          <div className="table-secondary">
                            {expense.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {expense.paidBy === "centre" ? "Centre" : "Teachers"}
                      </td>
                      <td>{money(expense.amount)}</td>
                      <td>
                        {expense.paidBy === "centre"
                          ? "—"
                          : expense.teacherCountSnapshot}
                      </td>
                      <td>{money(expense.isCancelled ? 0 : due)}</td>
                      <td>
                        {expense.isCancelled ? (
                          <button
                            type="button"
                            className="finance-text-button status cancelled"
                            onClick={() => setSelectedCancelledExpense(expense)}
                          >
                            {allRefunded
                              ? "Refunded / Details"
                              : "Cancelled / Details"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="finance-text-button"
                            onClick={() => handleCancelExpense(expense._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {!expenses.length && (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No expenses recorded for {getMonthLabel(billingMonth)}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="finances-section">
          <div className="finances-section-header">
            <div>
              <h2>Teacher's Expense Contributions</h2>
              <p>Track each teacher's share and outstanding contribution till date(TD).</p>
            </div>

            <button
              type="button"
              className="finance-icon-button"
              onClick={loadFinance}
              title="Refresh finance data"
              aria-label="Refresh finance data"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="table-container">
            <table className="finances-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Allocated(TD)</th>
                  <th>Paid(TD)</th>
                  <th>Due(TD)</th>
                  <th>Payment Method</th>
                  <th>Record Payment</th>
                </tr>
              </thead>

              <tbody>
                {contributionRows.map(teacher => {
                  const key = teacher.id

                  return (
                    <tr key={teacher.id}>
                      <td>
                        <strong>{teacher.name}</strong>
                        <div className="table-secondary">
                          {teacher.teacherId}
                        </div>
                      </td>
                      <td>{money(teacher.allocated)}</td>
                      <td>{money(teacher.paid)}</td>
                      <td>{money(teacher.due)}</td>
                      <td>
  {teacher.paymentMethods.length > 0 ? (
    teacher.due <= 0 ? (
      <span className="status paid">
        Paid by {teacher.paymentMethods.join(", ")}
      </span>
    ) : (
      <div className="table-secondary">
        Paid by {teacher.paymentMethods.join(", ")}
      </div>
    )
  ) : teacher.paid > 0 ? (
    <div className="table-secondary">
      Payment method not recorded
    </div>
  ) : teacher.due <= 0 ? (
    <span className="status paid">No payment required</span>
  ) : null}

  {teacher.due > 0 && (
    <select
      value={paymentMethods[key] || "cash"}
      onChange={event =>
        setPaymentMethods(previous => ({
          ...previous,
          [key]: event.target.value
        }))
      }
      aria-label={`Payment method for next payment by ${teacher.name}`}
    >
      <option value="cash">Cash</option>
      <option value="upi">UPI</option>
      <option value="bank_transfer">Bank transfer</option>
      <option value="other">Other</option>
    </select>
  )}
</td>
                      <td>
                        {teacher.due > 0 ? (
                          <div className="finance-contribution-row">
                            <input
                              type="number"
                              min="0.01"
                              max={teacher.due}
                              step="0.01"
                              placeholder="Enter amount"
                              value={paymentAmounts[key] || ""}
                              onChange={event =>
                                setPaymentAmounts(previous => ({
                                  ...previous,
                                  [key]: event.target.value
                                }))
                              }
                              aria-label={`Payment amount for ${teacher.name}`}
                            />
                            <button
                              type="button"
                              className="finance-primary-button"
                              onClick={() => handleContributionPayment(teacher)}
                            >
                              Record
                            </button>
                          </div>
                        ) : (
                          <span className="table-secondary">No due</span>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {!contributionRows.length && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No teacher contributions for this financial year.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedCancelledExpense && (
          <div
            className="finance-modal-backdrop"
            role="presentation"
            onClick={event => {
              if (event.target === event.currentTarget) {
                setSelectedCancelledExpense(null)
              }
            }}
          >
            <section
              className="finance-refund-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancelled-expense-title"
            >
              <div className="finance-modal-header">
                <div>
                  <h2 id="cancelled-expense-title">
                    Cancelled Expense Details
                  </h2>
                  <p>
                    {selectedCancelledExpense.category} ·{" "}
                    {new Date(
                      selectedCancelledExpense.expenseDate
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <button
                  type="button"
                  className="finance-icon-button"
                  onClick={() => setSelectedCancelledExpense(null)}
                  aria-label="Close expense details"
                >
                  <X size={18} />
                </button>
              </div>

              <p>
                <strong>Expense amount:</strong>{" "}
                {money(selectedCancelledExpense.amount)}
              </p>

              {selectedCancelledExpense.description && (
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedCancelledExpense.description}
                </p>
              )}

              {selectedCancelledExpense.cancelReason && (
                <p>
                  <strong>Cancellation reason:</strong>{" "}
                  {selectedCancelledExpense.cancelReason}
                </p>
              )}

              <div className="table-container">
                <table className="finances-table">
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Paid</th>
                      <th>Refunded</th>
                      <th>Refund Due</th>
                      <th>Status / Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedCancelledExpense.allocations || [])
                      .filter(
                        allocation =>
                          Number(allocation.paidAmount || 0) > 0
                      )
                      .map(allocation => {
                        const teacher = allocation.teacherId
                        if (!teacher?._id) return null

                        const key =
                          `${selectedCancelledExpense._id}-${teacher._id}`

                        const refunded = (allocation.refunds || []).reduce(
                          (total, refund) =>
                            total + Number(refund.amount || 0),
                          0
                        )

                        const refundDue = Math.max(
                          0,
                          Number(allocation.paidAmount || 0) - refunded
                        )

                        const isRefunded = refundDue <= 0

                        return (
                          <tr key={key}>
                            <td>
                              <strong>{teacher.name}</strong>
                              <div className="table-secondary">
                                {teacher.teacherId}
                              </div>
                            </td>

                            <td>{money(allocation.paidAmount)}</td>
                            <td>{money(refunded)}</td>
                            <td>{money(refundDue)}</td>

                            <td>
                              {isRefunded ? (
                                <span className="status paid">Refunded</span>
                              ) : (
                                <div className="finance-contribution-row">
                                  <input
                                    type="number"
                                    min="0.01"
                                    max={refundDue}
                                    step="0.01"
                                    placeholder="Refund amount"
                                    value={refundAmounts[key] || ""}
                                    onChange={event =>
                                      setRefundAmounts(previous => ({
                                        ...previous,
                                        [key]: event.target.value
                                      }))
                                    }
                                    aria-label={`Refund amount for ${teacher.name}`}
                                  />

                                  <select
                                    value={refundMethods[key] || "cash"}
                                    onChange={event =>
                                      setRefundMethods(previous => ({
                                        ...previous,
                                        [key]: event.target.value
                                      }))
                                    }
                                    aria-label={`Refund method for ${teacher.name}`}
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">
                                      Bank transfer
                                    </option>
                                    <option value="other">Other</option>
                                  </select>

                                  <button
                                    type="button"
                                    className="finance-primary-button"
                                    disabled={Boolean(refundSaving[key])}
                                    onClick={() =>
                                      handleTeacherRefund(
                                        selectedCancelledExpense,
                                        allocation
                                      )
                                    }
                                  >
                                    {refundSaving[key]
                                      ? "Saving..."
                                      : "Record Refund"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}

                    {!(selectedCancelledExpense.allocations || []).some(
                      allocation =>
                        Number(allocation.paidAmount || 0) > 0
                    ) && (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No teacher contributions were paid for this expense.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default Finances
