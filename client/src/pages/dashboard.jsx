import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"
import Sidebar from "../components/sidebar"
import "./dashboard.css"

const API = "http://localhost:3000/api"

function Dashboard() {
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!response.ok) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          navigate("/login")
          return
        }

        setUser(data.user)

        if (data.user.role === "admin") {
          const dashboardResponse = await fetch(
            `${API}/dashboard/admin`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )

          const dashboardData = await dashboardResponse.json()

          if (!dashboardResponse.ok) {
            throw new Error(
              dashboardData.message ||
              "Failed to load dashboard"
            )
          }

          setDashboard(dashboardData)
        }
      } catch (error) {
        setMessage(
          error.message ||
          "Unable to connect to server"
        )
      }
    }

    getUser()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    )}`
  }

  const formatDate = (value) => {
    if (!value) {
      return ""
    }

    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    )
  }

  const formatTime = (value) => {
    if (!value) {
      return ""
    }

    const [hour, minute] = value.split(":")
    const date = new Date()

    date.setHours(Number(hour))
    date.setMinutes(Number(minute))

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit"
      }
    )
  }

  if (message) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <p>{message}</p>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <p>Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user.name}</p>
          </div>

          <div className="dashboard-user">
            <span>{user.name}</span>
            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {user.role === "admin" && !dashboard && (
          <div className="dashboard-loading">
            Loading dashboard...
          </div>
        )}

        {user.role === "admin" && dashboard && (
          <>
            <section className="dashboard-summary">
              <div className="dashboard-summary-card">
                <span>Total Students</span>
                <strong>
                  {dashboard.summary.totalStudents}
                </strong>
              </div>

              <div className="dashboard-summary-card">
                <span>Active Students</span>
                <strong>
                  {dashboard.summary.activeStudents}
                </strong>
              </div>

              <div className="dashboard-summary-card">
                <span>Student Churn</span>
                <strong>
                  {dashboard.summary.studentChurn}
                </strong>
              </div>

              <div className="dashboard-summary-card">
                <span>Total Teachers</span>
                <strong>
                  {dashboard.summary.totalTeachers}
                </strong>
              </div>

              <div className="dashboard-summary-card">
                <span>This Month Collection</span>
                <strong>
                  {formatMoney(
                    dashboard.summary.thisMonthCollection
                  )}
                </strong>
              </div>

              <div className="dashboard-summary-card">
                <span>Outstanding Fees</span>
                <strong>
                  {formatMoney(
                    dashboard.summary.outstandingFees
                  )}
                </strong>
              </div>
            </section>

            <section className="dashboard-chart-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h2>Fee Collection</h2>
                    <p>
                      Weekly collection for the current month
                    </p>
                  </div>
                </div>

                <div className="dashboard-chart">
                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >
                    <LineChart
                      data={dashboard.feeCollection}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="week"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(value) =>
                          formatMoney(value)
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#80919f"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h2>Fee Status</h2>
                    <p>
                      Current month student fee status
                    </p>
                  </div>
                </div>

                <div className="dashboard-pie">
                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Paid",
                            value:
                              dashboard.feeStatus.paid
                          },
                          {
                            name: "Partial",
                            value:
                              dashboard.feeStatus.partial
                          },
                          {
                            name: "Due",
                            value:
                              dashboard.feeStatus.due
                          }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="dashboard-pie-legend">
                    <div>
                      <span className="dashboard-legend-dot paid" />
                      <span>Paid</span>
                      <strong>
                        {dashboard.feeStatus.paid}
                      </strong>
                    </div>

                    <div>
                      <span className="dashboard-legend-dot partial" />
                      <span>Partial</span>
                      <strong>
                        {dashboard.feeStatus.partial}
                      </strong>
                    </div>

                    <div>
                      <span className="dashboard-legend-dot due" />
                      <span>Due</span>
                      <strong>
                        {dashboard.feeStatus.due}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-two-column">
             <div className="dashboard-panel">
               <div className="dashboard-panel-header">
             <div>
               <h2>Upcoming Classes</h2>
            <p>Today's remaining classes</p>
           </div>
        </div>

            {dashboard.upcomingClasses.length === 0 ? (
            <div className="dashboard-empty">
      No upcoming classes today
    </div>
  ) : (
    <div className="dashboard-class-list">
      {dashboard.upcomingClasses.map((schedule) => (
        <div className="dashboard-class-item" key={schedule._id}>
          <div className="dashboard-class-teacher">
            <strong>{schedule.teacherId?.teacherId || "Teacher"}</strong>
            <span>{schedule.teacherId?.name || "Unknown"}</span>
          </div>
          <div className="dashboard-class-subject">
            <strong>{schedule.subjectId?.name || "Subject"}</strong>
            <span>Class {schedule.className}</span>
          </div>
          <div className="dashboard-class-time">
            <strong>{formatTime(schedule.startTime)}</strong>
            <span>{formatTime(schedule.endTime)}</span>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h2>Recent Notifications</h2>
                    <p>Latest system notifications</p>
                  </div>
                </div>

                {dashboard.recentNotifications.length === 0 ? (
                  <div className="dashboard-empty">
                    No recent notifications
                  </div>
                ) : (
                  <div className="dashboard-notification-list">
                    {dashboard.recentNotifications.map(
                      (notification) => (
                        <div
                          className="dashboard-notification-item"
                          key={notification._id}
                        >
                          <strong>
                            {notification.title}
                          </strong>

                          <p>
                            {notification.message}
                          </p>

                          <small>
                            {notification.sender?.name ||
                              "System"}{" "}
                            ·{" "}
                            {formatDate(
                              notification.createdAt
                            )}
                          </small>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Teacher Payments</h2>
                  <p>
                    Teacher payment based on collected fees
                  </p>
                </div>
              </div>

              <div className="dashboard-teacher-chart">
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={dashboard.teacherPayments}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 10
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="teacherId"
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        formatMoney(value)
                      }
                    />

                    <Bar
                      dataKey="teacherPayment"
                      fill="#80919f"
                      barSize={45}
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Recent Payments</h2>
                  <p>Latest fee payments received</p>
                </div>
              </div>

              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Subject</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.recentPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="dashboard-table-empty"
                        >
                          No recent payments
                        </td>
                      </tr>
                    ) : (
                      dashboard.recentPayments.map(
                        (payment) => (
                          <tr key={payment.id}>
                            <td>
                              <strong>
                                {payment.studentName}
                              </strong>
                            </td>

                            <td>
                              {payment.studentId}
                            </td>

                            <td>
                              {payment.subject}
                            </td>

                            <td>
                              {formatMoney(
                                payment.amount
                              )}
                            </td>

                            <td>
                              <span className="dashboard-payment-method">
                                {payment.paymentMethod}
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                payment.paymentDate
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {user.role === "teacher" && (
          <section className="dashboard-overview">
            <div className="overview-card">
              <h3>My Students</h3>
              <p>View students assigned to you</p>
            </div>

            <div className="overview-card">
              <h3>My Subjects</h3>
              <p>View the subjects you teach</p>
            </div>

            <div className="overview-card">
              <h3>My Schedule</h3>
              <p>View your class schedule</p>
            </div>

            <div className="overview-card">
              <h3>My Earnings</h3>
              <p>View your earnings</p>
            </div>
          </section>
        )}

        {user.role === "student" && (
          <section className="dashboard-overview">
            <div className="overview-card">
              <h3>My Subjects</h3>
              <p>View your enrolled subjects</p>
            </div>

            <div className="overview-card">
              <h3>My Teachers</h3>
              <p>View your teachers</p>
            </div>

            <div className="overview-card">
              <h3>My Schedule</h3>
              <p>View your class schedule</p>
            </div>

            <div className="overview-card">
              <h3>My Fees</h3>
              <p>View your fee details</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Dashboard