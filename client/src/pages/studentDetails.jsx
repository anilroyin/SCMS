import { useEffect, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom"

import Sidebar from "../components/sidebar"
import "./studentDetails.css"

function StudentDetails() {
  const [student, setStudent] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [status, setStatus] = useState("")
  const [message, setMessage] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [subjectMessage, setSubjectMessage] = useState("")
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [addingSubject, setAddingSubject] = useState(false)
  const [removingSubject, setRemovingSubject] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [newSubject, setNewSubject] = useState({
    subjectId: "",
    teacherId: "",
    fee: ""
  })

  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isStudentProfile =
    location.pathname === "/student/profile"

  const getStudent = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      const url = isStudentProfile
        ? "http://localhost:3000/api/students/me"
        : `http://localhost:3000/api/students/${id}`

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

      setStudent(data.student)
      setStatus(data.student.status)
    } catch (error) {
      setMessage("Unable to connect to server")
    }
  }

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      if (isStudentProfile) {
        getStudent()
        return
      }

      try {
        const [subjectsResponse, teachersResponse] =
          await Promise.all([
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

        const subjectsData =
          await subjectsResponse.json()

        const teachersData =
          await teachersResponse.json()

        if (!subjectsResponse.ok) {
          setMessage(subjectsData.message)
          return
        }

        if (!teachersResponse.ok) {
          setMessage(teachersData.message)
          return
        }

        setSubjects(subjectsData.subjects)
        setTeachers(teachersData.teachers)

        getStudent()
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getData()
  }, [id, navigate, isStudentProfile])

  const getTeachersForSubject = (subjectId) => {
    if (!subjectId) {
      return []
    }

    return teachers.filter((teacher) =>
      teacher.subjects.some(
        (subject) => subject._id === subjectId
      )
    )
  }

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
          body: JSON.stringify({ status })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setStatusMessage(data.message)
        setStatus(student.status)
        return
      }

      setStudent(data.student)
      setStatus(data.student.status)
      setStatusMessage(
        "Student status updated successfully"
      )
    } catch (error) {
      setStatusMessage("Unable to connect to server")
      setStatus(student.status)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddSubject = async (event) => {
    event.preventDefault()
    setSubjectMessage("")
    setAddingSubject(true)

    const token = localStorage.getItem("token")

    try {
      const response = await fetch(
        `http://localhost:3000/api/students/${id}/subjects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            subjectId: newSubject.subjectId,
            teacherId: newSubject.teacherId,
            fee: Number(newSubject.fee)
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setSubjectMessage(data.message)
        return
      }

      await getStudent()

      setNewSubject({
        subjectId: "",
        teacherId: "",
        fee: ""
      })

      setShowAddSubject(false)
      setSubjectMessage(
        "Subject added successfully"
      )
    } catch (error) {
      setSubjectMessage("Unable to connect to server")
    } finally {
      setAddingSubject(false)
    }
  }

  const handleRemoveSubject = async (subjectId) => {
    const shouldRemove = window.confirm(
      "Are you sure you want to remove this subject?"
    )

    if (!shouldRemove) {
      return
    }

    setSubjectMessage("")
    setRemovingSubject(subjectId)

    const token = localStorage.getItem("token")

    try {
      const response = await fetch(
        `http://localhost:3000/api/students/${id}/subjects/${subjectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setSubjectMessage(data.message)
        return
      }

      await getStudent()
      setSubjectMessage(
        "Subject removed successfully"
      )
    } catch (error) {
      setSubjectMessage("Unable to connect to server")
    } finally {
      setRemovingSubject("")
    }
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

  const availableSubjects = subjects.filter(
    (subject) =>
      !student.subjects.some(
        (studentSubject) =>
          studentSubject.subjectId._id ===
          subject._id
      )
  )

  const teachersForNewSubject =
    getTeachersForSubject(
      newSubject.subjectId
    )

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
            onClick={() =>
              navigate(
                isStudentProfile
                  ? "/"
                  : "/students"
              )
            }
          >
            {isStudentProfile
              ? "Back"
              : "Back"}
          </button>
        </div>

        <section className="student-details-card">
          <div className="student-details-header">
            <div>
              <h2>{isStudentProfile? "My Information" : "Student Information"}</h2>
              <p>
                Personal and academic information
              </p>
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
              <strong>
                {student.board || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>School</span>
              <strong>
                {student.school || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Gender</span>
              <strong>
                {student.gender || "-"}
              </strong>
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
              <strong>
                {student.phone || "-"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Guardian</span>
              <strong>
                {student.guardianName || "-"}
              </strong>
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
              <strong>
                {student.discount}%
              </strong>
            </div>

            <div className="detail-item">
              <span>Address</span>
              <strong>
                {student.address || "-"}
              </strong>
            </div>
          </div>
        </section>

        {!isStudentProfile && (
          <section className="student-details-card">
            <div className="student-details-header">
              <div>
                <h2>Student Status</h2>
                <p>
                  Manage the student's current
                  enrollment status
                </p>
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
                  <option value="active">
                    Active
                  </option>
                  <option value="paused">
                    Paused
                  </option>
                  <option value="left">
                    Left
                  </option>
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
        )}

        <section className="student-details-card">
          <div className="student-details-header">
            <div>
              <h2>Enrolled Subjects</h2>
              <p>
                Current subjects, teachers and
                monthly fees
              </p>
            </div>

            {!isStudentProfile && (
              <button
                className="secondary-button"
                onClick={() => {
                  setShowAddSubject(
                    !showAddSubject
                  )
                  setSubjectMessage("")
                }}
              >
                {showAddSubject
                  ? "Cancel"
                  : "Add Subject"}
              </button>
            )}
          </div>

          {!isStudentProfile &&
            showAddSubject && (
              <form
                className="add-subject-form"
                onSubmit={handleAddSubject}
              >
                <div className="add-subject-grid">
                  <div className="form-group">
                    <label htmlFor="newSubject">
                      Subject
                    </label>

                    <select
                      id="newSubject"
                      value={newSubject.subjectId}
                      onChange={(event) => {
                        setNewSubject({
                          ...newSubject,
                          subjectId:
                            event.target.value,
                          teacherId: ""
                        })
                        setSubjectMessage("")
                      }}
                      required
                    >
                      <option value="">
                        Select Subject
                      </option>

                      {availableSubjects.map(
                        (subject) => (
                          <option
                            key={subject._id}
                            value={subject._id}
                          >
                            {subject.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newTeacher">
                      Teacher
                    </label>

                    <select
                      id="newTeacher"
                      value={newSubject.teacherId}
                      onChange={(event) =>
                        setNewSubject({
                          ...newSubject,
                          teacherId:
                            event.target.value
                        })
                      }
                      disabled={
                        !newSubject.subjectId
                      }
                      required
                    >
                      <option value="">
                        Select Teacher
                      </option>

                      {teachersForNewSubject.map(
                        (teacher) => (
                          <option
                            key={teacher._id}
                            value={teacher._id}
                          >
                            {teacher.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newFee">
                      Monthly Fee
                    </label>

                    <input
                      id="newFee"
                      type="number"
                      min="0"
                      value={newSubject.fee}
                      onChange={(event) =>
                        setNewSubject({
                          ...newSubject,
                          fee: event.target.value
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="add-subject-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={addingSubject}
                  >
                    {addingSubject
                      ? "Adding..."
                      : "Add Subject"}
                  </button>
                </div>
              </form>
            )}

          {subjectMessage && (
            <p className="status-message">
              {subjectMessage}
            </p>
          )}

          {student.subjects.length === 0 ? (
            <p className="empty-message">
              No subjects currently enrolled.
            </p>
          ) : (
            <div className="table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Monthly Fee</th>
                    <th>Started</th>
                    {!isStudentProfile && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {student.subjects.map(
                    (subject) => (
                      <tr key={subject._id}>
                        <td>
                          {subject.subjectId.name}
                        </td>

                        <td>
                          {subject.teacherId.name}
                        </td>

                        <td>
                          ₹{subject.fee}
                        </td>

                        <td>
                          {new Date(
                            subject.startedAt
                          ).toLocaleDateString()}
                        </td>

                        {!isStudentProfile && (
                          <td>
                            <button
                              className="remove-button"
                              onClick={() =>
                                handleRemoveSubject(
                                  subject
                                    .subjectId
                                    ._id
                                )
                              }
                              disabled={
                                removingSubject ===
                                subject.subjectId
                                  ._id
                              }
                            >
                              {removingSubject ===
                              subject.subjectId._id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default StudentDetails