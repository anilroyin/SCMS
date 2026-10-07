import { useEffect, useState } from "react"
import Sidebar from "../components/sidebar"
import "./teacherEarnings.css"

function TeacherEarnings() {
  const [billingMonth, setBillingMonth] = useState("2026-10")
  const [earnings, setEarnings] = useState([])
  const [summary, setSummary] = useState({
    totalCollected: 0,
    teacherEarned: 0,
    commissionCut: 0
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    const getEarnings = async () => {
      const token = localStorage.getItem("token")

      try {
        const response = await fetch(
          `http://localhost:3000/api/teacher-earnings/me?billingMonth=${billingMonth}`,
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

        setEarnings(data.records)
        setSummary(data.summary)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getEarnings()
  }, [billingMonth])

  const formatMonth = (month) => {
    const date = new Date(`${month}-01`)
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    })
  }

  return (
    <div className="teacher-earnings-layout">
      <Sidebar />

      <main className="teacher-earnings-content">
        <header className="teacher-earnings-header">
          <div>
            <h1>My Earnings</h1>
            <p>
              Billing Month: {formatMonth(billingMonth)}
            </p>
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

        {message && (
          <p className="teacher-earnings-message">
            {message}
          </p>
        )}

        <section className="earnings-summary">
          <div className="earning-card">
            <h3>Total Collected</h3>
            <p>₹{summary.totalCollected.toFixed(2)}</p>
          </div>

          <div className="earning-card">
            <h3>My Earnings</h3>
            <p>₹{summary.teacherEarned.toFixed(2)}</p>
          </div>

          <div className="earning-card">
            <h3>Commission Cut</h3>
            <p>₹{summary.commissionCut.toFixed(2)}</p>
          </div>
        </section>

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
                        ₹{earning.teacherEarned.toFixed(2)}
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