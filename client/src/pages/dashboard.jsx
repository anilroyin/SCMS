import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./dashboard.css"

function Dashboard() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (!response.ok) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          navigate("/login")
          return
        }

        setUser(data.user)
      } catch (error) {
        setMessage("Unable to connect to server")
      }
    }

    getUser()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    navigate("/login")
  }

  if (message) {
    return <p>{message}</p>
  }

  if (!user) {
    return <p>Loading...</p>
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user.name}</p>
          </div>

          <div className="dashboard-user">
            <span>{user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="dashboard-overview">
          <div className="overview-card">
            <h3>Students</h3>
            <p>Manage students</p>
          </div>

          <div className="overview-card">
            <h3>Teachers</h3>
            <p>Manage teachers</p>
          </div>

          <div className="overview-card">
            <h3>Subjects</h3>
            <p>Manage subjects</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard