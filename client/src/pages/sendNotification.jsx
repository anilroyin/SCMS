import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./sendNotification.css"

function SendNotification() {
  const navigate = useNavigate()

  const [role, setRole] = useState("")
  const [targetType, setTargetType] = useState("")
  const [className, setClassName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [billingMonth, setBillingMonth] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const token = localStorage.getItem("token")

  const getUserFromToken = () => {
    try {
      const payload = token.split(".")[1]

      return JSON.parse(
        atob(
          payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      )
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getUserFromToken()

        if (!user) {
          throw new Error("Invalid authentication token")
        }

        setRole(user.role)

        if (user.role === "admin") {
          const [
            studentsResponse,
            teachersResponse
          ] = await Promise.all([
            fetch(
              "http://localhost:3000/api/students",
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

          const studentsData =
            await studentsResponse.json()

          const teachersData =
            await teachersResponse.json()

          if (!studentsResponse.ok) {
            throw new Error(
              studentsData.message ||
                "Failed to load students"
            )
          }

          if (!teachersResponse.ok) {
            throw new Error(
              teachersData.message ||
                "Failed to load teachers"
            )
          }

          const studentList = Array.isArray(
            studentsData
          )
            ? studentsData
            : studentsData.students || []

          const teacherList = Array.isArray(
            teachersData
          )
            ? teachersData
            : teachersData.teachers || []

          setStudents(studentList)
          setTeachers(teacherList)

          const uniqueClasses = [
            ...new Set(
              studentList
                .map(
                  (student) => student.className
                )
                .filter(Boolean)
            )
          ]

          setClasses(uniqueClasses)
        }

        if (user.role === "teacher") {
          const response = await fetch(
            "http://localhost:3000/api/teachers/me/students",
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
                "Failed to load students"
            )
          }

          const studentList = Array.isArray(data)
            ? data
            : data.students || []

          setStudents(studentList)

          const uniqueClasses = [
            ...new Set(
              studentList
                .map(
                  (student) => student.className
                )
                .filter(Boolean)
            )
          ]

          setClasses(uniqueClasses)
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const adminTargets = [
    {
      value: "everyone",
      label: "Everyone"
    },
    {
      value: "all_students",
      label: "All Students"
    },
    {
      value: "all_teachers",
      label: "All Teachers"
    },
    {
      value: "fee_due",
      label: "Fee Due Students"
    },
    {
      value: "fee_partial",
      label: "Partial Fee Students"
    },
    {
      value: "individual_student",
      label: "Individual Student"
    },
    {
      value: "individual_teacher",
      label: "Individual Teacher"
    }
  ]

  const teacherTargets = [
    {
      value: "teacher_students",
      label: "All My Students"
    },
    {
      value: "teacher_class",
      label: "Class-wise Students"
    },
    {
      value: "teacher_individual_student",
      label: "Individual Student"
    }
  ]

  const handleTargetChange = (event) => {
    setTargetType(event.target.value)
    setClassName("")
    setStudentId("")
    setTeacherId("")
    setBillingMonth("")
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError("")
    setSuccess("")
    setSending(true)

    try {
      const requestBody = {
        targetType,
        title,
        message
      }

      if (targetType === "teacher_class") {
        requestBody.className = className
      }

      if (
        targetType === "individual_student" ||
        targetType ===
          "teacher_individual_student"
      ) {
        requestBody.studentId = studentId
      }

      if (targetType === "individual_teacher") {
        requestBody.teacherId = teacherId
      }

      if (
        targetType === "fee_due" ||
        targetType === "fee_partial"
      ) {
        requestBody.billingMonth = billingMonth
      }

      const response = await fetch(
        "http://localhost:3000/api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send notification"
        )
      }

      setSuccess(
        "Notification sent successfully"
      )

      setTargetType("")
      setClassName("")
      setStudentId("")
      setTeacherId("")
      setBillingMonth("")
      setTitle("")
      setMessage("")
    } catch (error) {
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="send-notification-page">
        <div className="send-notification-loading">
          Loading...
        </div>
      </div>
    )
  }

  const targets =
    role === "admin"
      ? adminTargets
      : teacherTargets

  return (
    <div className="send-notification-page">
      <div className="send-notification-header">
        <div>
          <h1>Send Notification</h1>

          <p>
            Send a notification to students or
            teachers
          </p>
        </div>

        <button
          className="send-notification-back-button"
          onClick={() =>
            navigate("/notifications")
          }
        >
          Back
        </button>
      </div>

      <div className="send-notification-card">
        {error && (
          <div className="send-notification-error">
            {error}
          </div>
        )}

        {success && (
          <div className="send-notification-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="send-notification-field">
            <label htmlFor="target">
              Target
            </label>

            <select
              id="target"
              value={targetType}
              onChange={handleTargetChange}
              required
            >
              <option value="">
                Select target
              </option>

              {targets.map((target) => (
                <option
                  key={target.value}
                  value={target.value}
                >
                  {target.label}
                </option>
              ))}
            </select>
          </div>

          {(targetType === "fee_due" ||
            targetType === "fee_partial") && (
            <div className="send-notification-field">
              <label htmlFor="billingMonth">
                Billing Month
              </label>

              <input
                id="billingMonth"
                type="month"
                value={billingMonth}
                onChange={(event) =>
                  setBillingMonth(
                    event.target.value
                  )
                }
                required
              />
            </div>
          )}

          {targetType === "teacher_class" && (
            <div className="send-notification-field">
              <label htmlFor="className">
                Class
              </label>

              <select
                id="className"
                value={className}
                onChange={(event) =>
                  setClassName(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select class
                </option>

                {classes.map((classValue) => (
                  <option
                    key={classValue}
                    value={classValue}
                  >
                    {classValue}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "individual_student" && (
            <div className="send-notification-field">
              <label htmlFor="studentId">
                Student
              </label>

              <select
                id="studentId"
                value={studentId}
                onChange={(event) =>
                  setStudentId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.studentId
                      ? `${student.studentId} - ${student.name}`
                      : student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType ===
            "teacher_individual_student" && (
            <div className="send-notification-field">
              <label htmlFor="teacherStudentId">
                Student
              </label>

              <select
                id="teacherStudentId"
                value={studentId}
                onChange={(event) =>
                  setStudentId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.studentId
                      ? `${student.studentId} - ${student.name}`
                      : student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === "individual_teacher" && (
            <div className="send-notification-field">
              <label htmlFor="teacherId">
                Teacher
              </label>

              <select
                id="teacherId"
                value={teacherId}
                onChange={(event) =>
                  setTeacherId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select teacher
                </option>

                {teachers.map((teacher) => (
                  <option
                    key={teacher._id}
                    value={teacher._id}
                  >
                    {teacher.teacherId
                      ? `${teacher.teacherId} - ${teacher.name}`
                      : teacher.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="send-notification-field">
            <label htmlFor="title">
              Title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter notification title"
              required
            />
          </div>

          <div className="send-notification-field">
            <label htmlFor="message">
              Message
            </label>

            <textarea
              id="message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Write your notification message"
              rows="6"
              required
            />
          </div>

          <div className="send-notification-actions">
            <button
              type="button"
              className="send-notification-cancel-button"
              onClick={() =>
                navigate("/notifications")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="send-notification-submit-button"
              disabled={sending}
            >
              {sending
                ? "Sending..."
                : "Send Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SendNotification