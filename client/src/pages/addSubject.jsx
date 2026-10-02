import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./addSubject.css"

function AddSubject() {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage("")
    setLoading(true)

    const token = localStorage.getItem("token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/subjects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message)
        setLoading(false)
        return
      }

      navigate("/subjects")
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
            <h1>Add Subject</h1>
            <p>Add a new subject to the coaching center</p>
          </div>
        </div>

        {message && (
          <p className="page-message">{message}</p>
        )}

        <form
          className="subject-form"
          onSubmit={handleSubmit}
        >
          <section className="subject-form-section">
            <h2>Subject Information</h2>

            <div className="form-group">
              <label htmlFor="name">
                Subject Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group subject-description">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/subjects")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Subject"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AddSubject