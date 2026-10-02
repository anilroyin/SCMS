import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./subjectDetails.css"

function SubjectDetails() {
  const [subject, setSubject] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState("")

  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const getSubject = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/subjects/${id}`,
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

        setSubject(data.subject)
        setTeachers(data.teachers)
        setStudents(data.students)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getSubject()
  }, [id, navigate])

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

  if (!subject) {
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
            <h1>{subject.name}</h1>
            <p>Subject Details</p>
          </div>

          <div className="subject-header-actions">
            <button
              className="back-button"
              onClick={() =>
                navigate(`/subjects/${id}/edit`)
              }
            >
              Edit Subject
            </button>

            <button
              className="back-button"
              onClick={() => navigate("/subjects")}
            >
              Back to Subjects
            </button>
          </div>
        </div>

        <section className="subject-details-card">
          <div className="subject-details-header">
            <div>
              <h2>Subject Information</h2>
              <p>Basic information about this subject</p>
            </div>

            <span
              className={`status-badge ${subject.status}`}
            >
              {subject.status}
            </span>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span>Subject Name</span>
              <strong>{subject.name}</strong>
            </div>

            <div className="detail-item">
              <span>Status</span>
              <strong>{subject.status}</strong>
            </div>

            <div className="detail-item">
              <span>Teachers</span>
              <strong>{teachers.length}</strong>
            </div>

            <div className="detail-item">
              <span>Students</span>
              <strong>{students.length}</strong>
            </div>

            <div className="detail-item detail-description">
              <span>Description</span>
              <strong>
                {subject.description || "-"}
              </strong>
            </div>
          </div>
        </section>

        <section className="subject-details-card">
          <div className="subject-details-header">
            <div>
              <h2>Teachers</h2>
              <p>Teachers currently teaching this subject</p>
            </div>
          </div>

          {teachers.length === 0 ? (
            <p className="empty-message">
              No teachers currently assigned.
            </p>
          ) : (
            <div className="table-container">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Teacher ID</th>
                    <th>Name</th>
                    <th>Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.teacherId}</td>
                      <td>{teacher.name}</td>
                      <td>{teacher.commission}%</td>
                      <td>
                        <span
                          className={`status-badge ${teacher.status}`}
                        >
                          {teacher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="subject-details-card">
          <div className="subject-details-header">
            <div>
              <h2>Current Students</h2>
              <p>
                Students currently enrolled in this subject
              </p>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="empty-message">
              No students currently enrolled.
            </p>
          ) : (
            <div className="table-container">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Teacher</th>
                    <th>Monthly Fee</th>
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
                        {student.teacher?.name || "-"}
                      </td>
                      <td>₹{student.fee}</td>
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

export default SubjectDetails