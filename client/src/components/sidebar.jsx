import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"

function Sidebar() {
  const [role, setRole] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      try {
        const response = await fetch(
          "http://localhost:3000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (response.ok) {
          setRole(data.user.role)
        }
      } catch (error) {
        console.error("Failed to get user role")
      }
    }

    getUser()
  }, [])

  const adminLinks = [
    { label: "Dashboard", path: "/" },
    { label: "Students", path: "/students" },
    { label: "Teachers", path: "/teachers" },
    { label: "Subjects", path: "/subjects" },
    { label: "Fees", path: "/fees" },
    {
      label: "Teacher Payments",
      path: "/teacher-payments"
    },
    { label: "Schedule", path: "/schedule" },
    { label: "Reports", path: "/reports" },
    {
      label: "Notifications",
      path: "/notifications"
    }
  ]

  const teacherLinks = [
    { label: "Dashboard", path: "/" },
    { label: "My Profile", path: "/teacher/profile" },
    { label: "My Students", path: "/teacher/students" },
    { label: "My Schedule", path: "/teacher/schedule" },
    { label: "My Earnings", path: "/teacher/earnings" },
    {
      label: "Notifications",
      path: "/notifications"
    }
  ]

  const studentLinks = [
    { label: "Dashboard", path: "/" },
    { label: "My Profile", path: "/student/profile" },
    { label: "My Schedule", path: "/student/schedule" },
    { label: "My Fees", path: "/student/fees" },
    {
      label: "Notifications",
      path: "/notifications"
    }
  ]

  let links = []

  if (role === "admin") {
    links = adminLinks
  } else if (role === "teacher") {
    links = teacherLinks
  } else if (role === "student") {
    links = studentLinks
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>SCMS</h2>
        <p>Smart Coaching Management System</p>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar