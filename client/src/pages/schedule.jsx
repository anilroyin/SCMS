import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Plus,
  BookOpen,
  GraduationCap,
  Clock3,
  DoorOpen,
  Activity,
  Pencil,
  Trash2,
  CalendarCheck,
  CalendarX
} from "lucide-react"
import Sidebar from "../components/sidebar"
import "./schedule.css"

function Schedule() {
  const navigate = useNavigate()

  const [schedules, setSchedules] = useState([])
  const [user, setUser] = useState(null)
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const token = localStorage.getItem("token")

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setMessage("")

      const userResponse = await fetch(
        "https://scms-backend-uhfo.onrender.com/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const userData = await userResponse.json()

      if (!userResponse.ok) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/login")
        return
      }

      setUser(userData.user)

      const schedulesUrl =
        userData.user.role === "teacher"
          ? "https://scms-backend-uhfo.onrender.com/api/schedules/me"
          : userData.user.role === "student"
            ? "https://scms-backend-uhfo.onrender.com/api/schedules/student/me"
            : "https://scms-backend-uhfo.onrender.com/api/schedules"

      const response = await fetch(schedulesUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get schedules"
        )
      }

      setSchedules(data)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":")
    const date = new Date()

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    )

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    })
  }

  const getStatusClass = (status) => {
    if (status === "suspend") {
      return "schedule-status suspend"
    }

    if (status === "delay") {
      return "schedule-status delay"
    }

    return "schedule-status active"
  }

  const filteredSchedules = schedules
    .filter((schedule) => schedule.day === selectedDay)
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )

  const handleDelete = async (scheduleId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this schedule?"
    )

    if (!confirmed) {
      return
    }

    try {
      setMessage("")

      const response = await fetch(
        `https://scms-backend-uhfo.onrender.com/api/schedules/${scheduleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete schedule"
        )
      }

      setMessage("Schedule deleted successfully.")

      await fetchSchedules()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const isTeacher = user?.role === "teacher"
  const isStudent = user?.role === "student"
  const isReadOnly = isTeacher || isStudent

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <div className="schedule-page">
            <p>Loading schedules...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="schedule-page">
          <div className="schedule-page-header">
            <div>
              <h1>
                <CalendarDays size={22} />
                {isReadOnly ? "My Schedule" : "Schedule"}
              </h1>

              <p>
                {isReadOnly
                  ? "View your weekly coaching class schedule."
                  : "Manage the weekly coaching class schedule."}
              </p>
            </div>

            {!isReadOnly && (
              <button
                className="schedule-add-button"
                onClick={() => navigate("/schedule/add")}
              >
                <Plus size={17} />
                Add Schedule
              </button>
            )}
          </div>

          {message && (
            <div className="schedule-message">
              {message}
            </div>
          )}

          <div className="schedule-day-selector">
            {days.map((day) => (
              <button
                key={day}
                className={
                  selectedDay === day
                    ? "schedule-day-button active"
                    : "schedule-day-button"
                }
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="schedule-card">
            <div className="schedule-card-header">
              <div>
                <h2>
                  <CalendarCheck size={19} />
                  {selectedDay}
                </h2>

                <p>
                  {filteredSchedules.length}{" "}
                  {filteredSchedules.length === 1
                    ? "class"
                    : "classes"}{" "}
                  scheduled
                </p>
              </div>
            </div>

            {filteredSchedules.length === 0 ? (
              <div className="schedule-empty">
                <CalendarX size={30} />
                <p>
                  No classes scheduled for {selectedDay}.
                </p>
              </div>
            ) : (
              <div className="schedule-table-container">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>
                        <BookOpen size={15} />
                        Subject
                      </th>
                      <th>
                        <GraduationCap size={15} />
                        Class
                      </th>
                      <th>
                        <GraduationCap size={15} />
                        Teacher
                      </th>
                      <th>
                        <Clock3 size={15} />
                        Start Time
                      </th>
                      <th>
                        <Clock3 size={15} />
                        End Time
                      </th>
                      <th>
                        <DoorOpen size={15} />
                        Room
                      </th>
                      <th>
                        <Activity size={15} />
                        Status
                      </th>

                      {!isReadOnly && <th>Action</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSchedules.map((schedule) => (
                      <tr key={schedule._id}>
                        <td>
                          <strong>
                            {schedule.subjectId?.name || "-"}
                          </strong>
                        </td>

                        <td>{schedule.className}</td>

                        <td>
                          <strong>
                            {schedule.teacherId?.teacherId || "-"}
                          </strong>

                          <span className="schedule-secondary">
                            {schedule.teacherId?.name || "-"}
                          </span>
                        </td>

                        <td>
                          {formatTime(schedule.startTime)}
                        </td>

                        <td>
                          {formatTime(schedule.endTime)}
                        </td>

                        <td>{schedule.room}</td>

                        <td>
                          <span
                            className={getStatusClass(
                              schedule.status
                            )}
                          >
                            {schedule.status === "suspend"
                              ? "Suspend"
                              : schedule.status === "delay"
                                ? "Delay"
                                : "Active"}
                          </span>
                        </td>

                        {!isReadOnly && (
                          <td>
                            <div className="schedule-actions">
                              <button
                                className="schedule-edit-button"
                                onClick={() =>
                                  navigate(
                                    `/schedule/${schedule._id}/edit`
                                  )
                                }
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                className="schedule-delete-button"
                                onClick={() =>
                                  handleDelete(schedule._id)
                                }
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Schedule