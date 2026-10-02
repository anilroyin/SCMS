import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./editTeacher.css"

function EditTeacher() {
  const [subjects, setSubjects] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingTeacher, setLoadingTeacher] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    email: "",
    commission: "",
    status: ""
  })

  const [selectedSubjects, setSelectedSubjects] = useState([])

  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const getData = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const [teacherResponse, subjectsResponse] =
          await Promise.all([
            fetch(
              `http://localhost:3000/api/teachers/${id}`,
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
            )
          ])

        const teacherData = await teacherResponse.json()
        const subjectsData = await subjectsResponse.json()

        if (!teacherResponse.ok) {
          setMessage(teacherData.message)
          return
        }

        if (!subjectsResponse.ok) {
          setMessage(subjectsData.message)
          return
        }

        const teacher = teacherData.teacher

        setFormData({
          name: teacher.name || "",
          dateOfBirth: teacher.dateOfBirth
            ? teacher.dateOfBirth.split("T")[0]
            : "",
          gender: teacher.gender || "",
          phone: teacher.phone || "",
          address: teacher.address || "",
          email: teacher.userId?.email || "",
          commission:
            teacher.commission !== undefined
              ? teacher.commission
              : "",
          status: teacher.status || "active"
        })

        setSelectedSubjects(
          teacher.subjects.map((subject) => subject._id)
        )

        setSubjects(subjectsData.subjects)
      } catch (error) {
        setMessage("Unable to connect to server")
      } finally {
        setLoadingTeacher(false)
      }
    }

    getData()
  }, [id, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }))
  }

  const handleSubjectChange = (event) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    )

    setSelectedSubjects(selectedOptions)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage("")
    setLoading(true)

    const token = localStorage.getItem("token")

    try {
      const response = await fetch(
        `http://localhost:3000/api/teachers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            commission: Number(formData.commission),
            subjects: selectedSubjects
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message)
        return
      }

      navigate(`/teachers/${id}`)
    } catch (error) {
      setMessage("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  if (loadingTeacher) {
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
            <h1>Edit Teacher</h1>
            <p>Update teacher information</p>
          </div>
        </div>

        {message && (
          <p className="page-message">{message}</p>
        )}

        <form
          className="teacher-form"
          onSubmit={handleSubmit}
        >
          <section className="teacher-form-section">
            <h2>Teacher Information</h2>

            <div className="teacher-form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">
                  Date of Birth *
                </label>

                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group teacher-address">
              <label htmlFor="address">Address</label>

              <textarea
                id="address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="teacher-form-section">
            <h2>Login Information</h2>

            <div className="teacher-form-grid">
              <div className="form-group">
                <label htmlFor="email">Login Email *</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          <section className="teacher-form-section">
            <h2>Teaching Information</h2>

            <div className="teacher-form-grid">
              <div className="form-group">
                <label htmlFor="subjects">
                  Subjects Taught *
                </label>

                <select
                  id="subjects"
                  multiple
                  value={selectedSubjects}
                  onChange={handleSubjectChange}
                  required
                >
                  {subjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject._id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>

                <small>
                  Hold Ctrl and select multiple subjects.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="commission">
                  Commission (%) *
                </label>

                <input
                  id="commission"
                  name="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/teachers/${id}`)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default EditTeacher