import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./students.css"

function Students() {
  const [students, setStudents] = useState([])
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [schoolFilter, setSchoolFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [teacherFilter, setTeacherFilter] = useState("all")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const getStudents = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const userResponse = await fetch(
          "http://localhost:3000/api/auth/me",
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

        const studentsUrl =
          userData.user.role === "teacher"
            ? "http://localhost:3000/api/teachers/me/students"
            : "http://localhost:3000/api/students"

        const response = await fetch(studentsUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message)
          return
        }

        setStudents(data.students)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getStudents()
  }, [navigate])

  const classes = [
    ...new Set(students.map((student) => student.className).filter(Boolean))
  ].sort()

  const schools = [
    ...new Set(students.map((student) => student.school).filter(Boolean))
  ].sort()

  const subjects = [
    ...new Map(
      students.flatMap((student) =>
        student.subjects.map((subject) => [
          subject.subjectId._id,
          subject.subjectId.name
        ])
      )
    )
  ]

  const teachers = [
    ...new Map(
      students.flatMap((student) =>
        student.subjects.map((subject) => [
          subject.teacherId._id,
          subject.teacherId.name
        ])
      )
    )
  ]

  const filteredStudents = students.filter((student) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      student.studentId.toLowerCase().includes(searchText) ||
      student.name.toLowerCase().includes(searchText) ||
      (student.school || "").toLowerCase().includes(searchText)

    const matchesStatus =
      statusFilter === "all" ||
      student.status === statusFilter

    const matchesClass =
      classFilter === "all" ||
      student.className === classFilter

    const matchesSchool =
      schoolFilter === "all" ||
      student.school === schoolFilter

    const matchesSubject =
      subjectFilter === "all" ||
      student.subjects.some(
        (subject) => subject.subjectId._id === subjectFilter
      )

    const matchesTeacher =
      teacherFilter === "all" ||
      student.subjects.some(
        (subject) => subject.teacherId._id === teacherFilter
      )

    return (
      matchesSearch &&
      matchesStatus &&
      matchesClass &&
      matchesSchool &&
      matchesSubject &&
      matchesTeacher
    )
  })

  const totalStudents = students.length

  const activeStudents = students.filter(
    (student) => student.status === "active"
  ).length

  const pausedStudents = students.filter(
    (student) => student.status === "paused"
  ).length

  const leftStudents = students.filter(
    (student) => student.status === "left"
  ).length

  const isTeacher = user?.role === "teacher"

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>{isTeacher ? "My Students" : "Students"}</h1>

            <p>
              {isTeacher
                ? "Students assigned to you"
                : "Manage admitted students"}
            </p>
          </div>

          {!isTeacher && (
            <button
              className="primary-button"
              onClick={() => navigate("/students/admit")}
            >
              Admit a Student
            </button>
          )}
        </div>

        {message && <p className="page-message">{message}</p>}

        <section className="student-summary">
          <div className="summary-card">
            <span>{isTeacher ? "My Students" : "Total Students"}</span>
            <strong>{totalStudents}</strong>
          </div>

          <div className="summary-card">
            <span>Active</span>
            <strong>{activeStudents}</strong>
          </div>

          <div className="summary-card">
            <span>Paused</span>
            <strong>{pausedStudents}</strong>
          </div>

          <div className="summary-card">
            <span>Left</span>
            <strong>{leftStudents}</strong>
          </div>
        </section>

        <div className="students-card">
          <div className="students-card-header">
            <h2>{isTeacher ? "My Students" : "All Students"}</h2>

            <input
              type="search"
              placeholder="Search by ID, name or school..."
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="student-filters">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="left">Left</option>
            </select>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="all">All Classes</option>

              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <select
              value={schoolFilter}
              onChange={(event) => setSchoolFilter(event.target.value)}
            >
              <option value="all">All Schools</option>

              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">All Subjects</option>

              {subjects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {!isTeacher && (
              <select
                value={teacherFilter}
                onChange={(event) =>
                  setTeacherFilter(event.target.value)
                }
              >
                <option value="all">All Teachers</option>

                {teachers.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredStudents.length === 0 ? (
            <p className="empty-message">
              No students found.
            </p>
          ) : (
            <div className="table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>School</th>
                    <th>Subjects</th>
                    <th>Teachers</th>
                    <th>Status</th>
                    {!isTeacher && <th>Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const teacherCount = new Set(
                      student.subjects.map(
                        (subject) => subject.teacherId._id
                      )
                    ).size

                    return (
                      <tr key={student._id}>
                        <td>{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{student.className}</td>
                        <td>{student.school || "-"}</td>
                        <td>{student.subjects.length}</td>
                        <td>{teacherCount}</td>
                        <td>
                          <span
                            className={`status-badge ${student.status}`}
                          >
                            {student.status}
                          </span>
                        </td>

                        {!isTeacher && (
                          <td>
                            <button
                              className="view-button"
                              onClick={() =>
                                navigate(
                                  `/students/${student._id}`
                                )
                              }
                            >
                              View 👁️
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Students