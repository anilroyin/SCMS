import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./studentDetails.css"

function StudentDetails() {
  const [student, setStudent] = useState(null)
  const [status, setStatus] = useState("")
  const [message, setMessage] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const getStudent = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/students/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message)
          return
        }

        setStudent(data.student)
        setStatus(data.student.status)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getStudent()
  }, [id, navigate])

  const handleStatusUpdate = async () => {
    if (status === student.status) {
      setStatusMessage("No status change was made")
      return
    }

    setStatusMessage("")
    setUpdatingStatus(true)

    const token = localStorage.getItem("token")

    try {
      const response = await fetch(
        `http://localhost:3000/api/students/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setStatusMessage(data.message)
        setStatus(student.status)
        setUpdatingStatus(false)
        return
      }

      setStudent(data.student)
      setStatus(data.student.status)
      setStatusMessage("Student status updated successfully")
    } catch (error) {
      setStatusMessage("Unable to connect to server")
      setStatus(student.status)
    }

    setUpdatingStatus(false)
  }

  if (message) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <p className="page-message">{message}</p>
        </main>
      </div>
    )
  }

  if (!student) {
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
        <div className="page-header">
          <div>
            <h1>{student.name}</h1>
            <p>{student.studentId}</p>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/students")}
          >
            Back to Students
          </button>
        </div>

        <section className="student-details-card">
          <div className="student-details-header">
            <div>
              <h2>Student Information</h2>
              <p>Personal and academic information</p>
            </div>

            <span
              className={`status-badge ${student.status}`}
            >
              {student.status}
            </span>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span>Student ID</span>
              <strong>{student.studentId}</strong>
            </div>

            <div className="detail-item">
              <span>Name</span>
              <strong>{student.name}</strong>
            </div>

            <div className="detail-item">
              <span>Class</span>
              <strong>{student.className}</strong>
            </div>

            <div className="detail-item">
              <span>Board</span>
              <strong>{student.board || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>School</span>
              <strong>{student.school || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Gender</span>
              <strong>{student.gender || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Date of Birth</span>
              <strong>
                {student.dateOfBirth
                  ? new Date(
                      student.dateOfBirth
                    ).toLocaleDateString()
                  : "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Phone</span>
              <strong>{student.phone || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Guardian</span>
              <strong>{student.guardianName || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Admission Date</span>
              <strong>
                {new Date(
                  student.admissionDate
                ).toLocaleDateString()}
              </strong>
            </div>

            <div className="detail-item">
              <span>Discount</span>
              <strong>{student.discount}%</strong>
            </div>

            <div className="detail-item">
              <span>Address</span>
              <strong>{student.address || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="student-details-card">
          <div className="student-details-header">
            <div>
              <h2>Student Status</h2>
              <p>Manage the student's current enrollment status</p>
            </div>
          </div>

          <div className="status-management">
            <div className="status-control">
              <label htmlFor="studentStatus">
                Current Status
              </label>

              <select
                id="studentStatus"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setStatusMessage("")
                }}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="left">Left</option>
              </select>
            </div>

            <button
              className="primary-button"
              onClick={handleStatusUpdate}
              disabled={updatingStatus}
            >
              {updatingStatus
                ? "Updating..."
                : "Update Status"}
            </button>
          </div>

          {statusMessage && (
            <p className="status-message">
              {statusMessage}
            </p>
          )}
        </section>

        <section className="student-details-card">
          <div className="student-details-header">
            <div>
              <h2>Enrolled Subjects</h2>
              <p>Subjects, teachers and monthly fees</p>
            </div>
          </div>

          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {student.subjects.map((subject) => (
                  <tr key={subject._id}>
                    <td>{subject.subjectId.name}</td>
                    <td>{subject.teacherId.name}</td>
                    <td>₹{subject.fee}</td>
                    <td>
                      <span
                        className={`status-badge ${subject.status}`}
                      >
                        {subject.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default StudentDetails