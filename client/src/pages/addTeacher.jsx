import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./addTeacher.css"

function AddTeacher() {
  const [subjects, setSubjects] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    commission: ""
  })

  const [selectedSubjects, setSelectedSubjects] = useState([])

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
        "http://localhost:3000/api/teachers",
        {
          method: "POST",
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
        setLoading(false)
        return
      }

      navigate("/teachers")
    } catch (error) {
      setMessage("Unable to connect to server")
    }

    setLoading(false)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="page-header">
          <div>
            <h1>Add Teacher</h1>
            <p>Add a new teacher to the coaching center</p>
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

              <div className="form-group">
                <label htmlFor="password">
                  Initial Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
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
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/teachers")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Teacher"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AddTeacher