import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./teachers.css"

function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const getTeachers = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(
          "http://localhost:3000/api/teachers",
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

        setTeachers(data.teachers)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getTeachers()
  }, [navigate])

  const filteredTeachers = teachers.filter((teacher) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      teacher.teacherId.toLowerCase().includes(searchText) ||
      teacher.name.toLowerCase().includes(searchText)

    const matchesStatus =
      statusFilter === "all" ||
      teacher.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalTeachers = teachers.length

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "active"
  ).length

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "inactive"
  ).length

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Teachers</h1>
            <p>Manage coaching center teachers</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/teachers/add")}
          >
            Add Teacher
          </button>
        </div>

        {message && (
          <p className="page-message">{message}</p>
        )}

        <section className="teacher-summary">
          <div className="summary-card">
            <span>Total Teachers</span>
            <strong>{totalTeachers}</strong>
          </div>

          <div className="summary-card">
            <span>Active</span>
            <strong>{activeTeachers}</strong>
          </div>

          <div className="summary-card">
            <span>Inactive</span>
            <strong>{inactiveTeachers}</strong>
          </div>
        </section>

        <div className="teachers-card">
          <div className="teachers-card-header">
            <h2>All Teachers</h2>

            <input
              type="search"
              placeholder="Search by ID or name..."
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="teacher-filters">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {filteredTeachers.length === 0 ? (
            <p className="empty-message">
              Loading all teachers...
            </p>
          ) : (
            <div className="table-container">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>Teacher ID</th>
                    <th>Name</th>
                    <th>Students</th>
                    <th>Subjects</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.teacherId}</td>

                      <td>{teacher.name}</td>

                      <td>{teacher.studentCount}</td>

                      <td>{teacher.subjects.length}</td>

                      <td>{teacher.commission}%</td>

                      <td>
                        <span
                          className={`status-badge ${teacher.status}`}
                        >
                          {teacher.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-button"
                          onClick={() =>
                            navigate(
                              `/teachers/${teacher._id}`
                            )
                          }
                        >
                          View 👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Teachers