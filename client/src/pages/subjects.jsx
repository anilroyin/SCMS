import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./subjects.css"

function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const getSubjects = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(
          "http://localhost:3000/api/subjects",
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

        setSubjects(data.subjects)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getSubjects()
  }, [navigate])

  const filteredSubjects = subjects.filter((subject) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      subject.name.toLowerCase().includes(searchText) ||
      (subject.description || "")
        .toLowerCase()
        .includes(searchText)

    const matchesStatus =
      statusFilter === "all" ||
      subject.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalSubjects = subjects.length

  const activeSubjects = subjects.filter(
    (subject) => subject.status === "active"
  ).length

  const inactiveSubjects = subjects.filter(
    (subject) => subject.status === "inactive"
  ).length

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Subjects</h1>
            <p>Manage coaching center subjects</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/subjects/add")}
          >
            Add Subject
          </button>
        </div>

        {message && (
          <p className="page-message">{message}</p>
        )}

        <section className="subject-summary">
          <div className="summary-card">
            <span>Total Subjects</span>
            <strong>{totalSubjects}</strong>
          </div>

          <div className="summary-card">
            <span>Active</span>
            <strong>{activeSubjects}</strong>
          </div>

          <div className="summary-card">
            <span>Inactive</span>
            <strong>{inactiveSubjects}</strong>
          </div>
        </section>

        <div className="subjects-card">
          <div className="subjects-card-header">
            <h2>All Subjects</h2>

            <input
              type="search"
              placeholder="Search by subject..."
              className="search-input"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="subject-filters">
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

          {filteredSubjects.length === 0 ? (
            <p className="empty-message">
              Loading all subjects...
            </p>
          ) : (
            <div className="table-container">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Description</th>
                    <th>Teachers</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td>{subject.name}</td>
                      <td>{subject.description || "-"}</td>
                      <td>{subject.teacherCount}</td>
                      <td>{subject.studentCount}</td>
                      <td>
                        <span
                          className={`status-badge ${subject.status}`}
                        >
                          {subject.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-button"
                          onClick={() =>
                            navigate(
                              `/subjects/${subject._id}`
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

export default Subjects