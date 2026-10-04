import { useEffect, useState } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./teacherDetails.css"

function TeacherDetails() {
  const [teacher, setTeacher] = useState(null)
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState("")

  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isTeacherProfile = location.pathname === "/teacher/profile"

  useEffect(() => {
    const getTeacher = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const url = isTeacherProfile
          ? "http://localhost:3000/api/teachers/me"
          : `http://localhost:3000/api/teachers/${id}`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message)
          return
        }

        setTeacher(data.teacher)
        setStudents(data.students || [])
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getTeacher()
  }, [id, isTeacherProfile, navigate])

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

  if (!teacher) {
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
            <h1>{teacher.name}</h1>
            <p>{teacher.teacherId}</p>
          </div>

          <div className="teacher-header-actions">
            {!isTeacherProfile && (
              <button
                className="back-button"
                onClick={() =>
                  navigate(`/teachers/${id}/edit`)
                }
              >
                Edit Teacher
              </button>
            )}

            {isTeacherProfile ? (
              <button
                className="back-button"
                onClick={() => navigate("/")}
              >
                Back
              </button>
            ) : (
              <button
                className="back-button"
                onClick={() => navigate("/teachers")}
              >
                Back
              </button>
            )}
          </div>
        </div>

        <section className="teacher-details-card">
          <div className="teacher-details-header">
            <div>
              <h2>Teacher Information</h2>
              <p>Personal and contact information</p>
            </div>

            <span className={`status-badge ${teacher.status}`}>
              {teacher.status}
            </span>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span>Teacher ID</span>
              <strong>{teacher.teacherId}</strong>
            </div>

            <div className="detail-item">
              <span>Name</span>
              <strong>{teacher.name}</strong>
            </div>

            <div className="detail-item">
              <span>Date of Birth</span>
              <strong>
                {teacher.dateOfBirth
                  ? new Date(
                      teacher.dateOfBirth
                    ).toLocaleDateString()
                  : "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Gender</span>
              <strong>{teacher.gender || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Phone</span>
              <strong>{teacher.phone || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Email</span>
              <strong>
                {teacher.userId?.email || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Address</span>
              <strong>{teacher.address || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Commission</span>
              <strong>{teacher.commission}%</strong>
            </div>

            <div className="detail-item">
              <span>Students</span>
              <strong>{students.length}</strong>
            </div>
          </div>
        </section>

        <section className="teacher-details-card">
          <div className="teacher-details-header">
            <div>
              <h2>Teaching Information</h2>
              <p>Subjects assigned to this teacher</p>
            </div>
          </div>

          {teacher.subjects.length === 0 ? (
            <p className="empty-message">
              No subjects assigned.
            </p>
          ) : (
            <div className="subject-list">
              {teacher.subjects.map((subject) => (
                <div
                  className="subject-item"
                  key={subject._id}
                >
                  {subject.name}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="teacher-details-card">
          <div className="teacher-details-header">
            <div>
              <h2>Current Students</h2>
              <p>
                Students assigned to this teacher
              </p>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="empty-message">
              No students currently assigned.
            </p>
          ) : (
            <div className="table-container">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Subjects</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>
                      <td>{student.className}</td>
                      <td>
                        {student.subjects
                          .map((subject) => subject.name)
                          .join(", ")}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${student.status}`}
                        >
                          {student.status}
                        </span>
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

export default TeacherDetails