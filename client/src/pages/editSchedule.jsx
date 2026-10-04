import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./editSchedule.css"

function EditSchedule() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])

  const [formData, setFormData] = useState({
    day: "",
    subjectId: "",
    className: "",
    teacherId: "",
    startTime: "",
    endTime: "",
    room: "",
    status: "active"
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const token = localStorage.getItem("token")

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true)
        setMessage("")

        const [
          scheduleResponse,
          subjectsResponse,
          teachersResponse
        ] = await Promise.all([
          fetch(
            `http://localhost:3000/api/schedules/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),
          fetch(
            "http://localhost:3000/api/subjects",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),
          fetch(
            "http://localhost:3000/api/teachers",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ])

        const scheduleData =
          await scheduleResponse.json()

        const subjectsData =
          await subjectsResponse.json()

        const teachersData =
          await teachersResponse.json()

        if (!scheduleResponse.ok) {
          throw new Error(
            scheduleData.message ||
              "Failed to get schedule"
          )
        }

        if (!subjectsResponse.ok) {
          throw new Error(
            subjectsData.message ||
              "Failed to get subjects"
          )
        }

        if (!teachersResponse.ok) {
          throw new Error(
            teachersData.message ||
              "Failed to get teachers"
          )
        }

        setSubjects(subjectsData.subjects)
        setTeachers(teachersData.teachers)

        setFormData({
          day: scheduleData.day || "",
          subjectId:
            scheduleData.subjectId?._id ||
            scheduleData.subjectId ||
            "",
          className:
            scheduleData.className || "",
          teacherId:
            scheduleData.teacherId?._id ||
            scheduleData.teacherId ||
            "",
          startTime:
            scheduleData.startTime || "",
          endTime:
            scheduleData.endTime || "",
          room: scheduleData.room || "",
          status:
            scheduleData.status || "active"
        })
      } catch (error) {
        setMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, [id, token])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")

    if (
      !formData.subjectId ||
      !formData.teacherId ||
      !formData.className ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.room
    ) {
      setMessage(
        "Please fill in all required fields."
      )
      return
    }

    if (formData.startTime >= formData.endTime) {
      setMessage(
        "End time must be later than start time."
      )
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        `http://localhost:3000/api/schedules/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update schedule"
        )
      }

      navigate("/schedule")
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <div className="edit-schedule-page">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="edit-schedule-page">
          <div className="edit-schedule-header">
            <div>
              <h1>Edit Schedule</h1>

              <p>
                Update the coaching class schedule.
              </p>
            </div>

            <button
              type="button"
              className="edit-schedule-back-button"
              onClick={() => navigate("/schedule")}
            >
              Back to Schedule
            </button>
          </div>

          {message && (
            <div className="edit-schedule-message">
              {message}
            </div>
          )}

          <form
            className="edit-schedule-card"
            onSubmit={handleSubmit}
          >
            <div className="edit-schedule-form-grid">
              <div className="edit-schedule-field">
                <label htmlFor="day">
                  Day
                </label>

                <select
                  id="day"
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                >
                  <option value="">
                    Select day
                  </option>

                  <option value="Monday">
                    Monday
                  </option>

                  <option value="Tuesday">
                    Tuesday
                  </option>

                  <option value="Wednesday">
                    Wednesday
                  </option>

                  <option value="Thursday">
                    Thursday
                  </option>

                  <option value="Friday">
                    Friday
                  </option>

                  <option value="Saturday">
                    Saturday
                  </option>

                  <option value="Sunday">
                    Sunday
                  </option>
                </select>
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="subjectId">
                  Subject
                </label>

                <select
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                >
                  <option value="">
                    Select subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject._id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="className">
                  Class
                </label>

                <input
                  id="className"
                  name="className"
                  type="text"
                  placeholder="e.g. Class IX"
                  value={formData.className}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="teacherId">
                  Teacher
                </label>

                <select
                  id="teacherId"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                >
                  <option value="">
                    Select teacher
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher._id}
                    >
                      {teacher.teacherId} -{" "}
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="startTime">
                  Start Time
                </label>

                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="endTime">
                  End Time
                </label>

                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="room">
                  Room
                </label>

                <input
                  id="room"
                  name="room"
                  type="text"
                  placeholder="e.g. Room 1"
                  value={formData.room}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-schedule-field">
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="suspend">
                    Suspend
                  </option>

                  <option value="delay">
                    Delay
                  </option>
                </select>
              </div>
            </div>

            <div className="edit-schedule-form-actions">
              <button
                type="button"
                className="edit-schedule-cancel-button"
                onClick={() => navigate("/schedule")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="edit-schedule-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Update Schedule"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EditSchedule