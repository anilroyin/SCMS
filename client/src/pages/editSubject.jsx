import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./editSubject.css"

function EditSubject() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active"
  })

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSubject, setLoadingSubject] = useState(true)

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

        setFormData({
          name: data.subject.name || "",
          description: data.subject.description || "",
          status: data.subject.status || "active"
        })
      } catch (error) {
        setMessage("Unable to connect to server")
      } finally {
        setLoadingSubject(false)
      }
    }

    getSubject()
  }, [id, navigate])

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
        `http://localhost:3000/api/subjects/${id}`,
        {
          method: "PUT",
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
        return
      }

      navigate(`/subjects/${id}`)
    } catch (error) {
      setMessage("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  if (loadingSubject) {
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
            <h1>Edit Subject</h1>
            <p>Update subject information</p>
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

            <div className="form-group subject-status">
              <label htmlFor="status">
                Status *
              </label>

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
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(`/subjects/${id}`)}
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

export default EditSubject