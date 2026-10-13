
import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"

function Sidebar() {
  const location = useLocation()

  const [role, setRole] = useState(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      return ""
    }

    try {
      const payload = token.split(".")[1]

      const user = JSON.parse(
        atob(
          payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      )

      return user.role || ""
    } catch (error) {
      return ""
    }
  })

  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const count = localStorage.getItem("unreadNotifications")
    return count ? Number(count) : 0
  })

  const getUnreadNotificationCount = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      return
    }

    try {
      const payload = token.split(".")[1]

      const user = JSON.parse(
        atob(
          payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      )

      const endpoint =
        user.role === "admin"
          ? "http://localhost:3000/api/notifications/logs"
          : "http://localhost:3000/api/notifications/me"

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return
      }

      const notifications = Array.isArray(data)
        ? data
        : data.notifications || []

      const unreadCount =
        user.role === "admin"
          ? notifications.filter(
              (notification) => !notification.adminRead
            ).length
          : notifications.filter(
              (notification) => !notification.isRead
            ).length

      setUnreadNotifications(unreadCount)

      localStorage.setItem(
        "unreadNotifications",
        unreadCount.toString()
      )
    } catch (error) {
      return
    }
  }

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
    getUnreadNotificationCount()

    const updateNotifications = () => {
      getUnreadNotificationCount()
    }

    window.addEventListener(
      "notificationsUpdated",
      updateNotifications
    )

    const interval = setInterval(
      getUnreadNotificationCount,
      15000
    )

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        updateNotifications
      )

      clearInterval(interval)
    }
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
    },
    {
      label: "Help & Support",
      path: "/student/help-support"
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
            state={
              ["/fees", "/teacher-payments"].includes(link.path)
                ? { from: location.pathname }
                : undefined
            }
            onClick={() => {
              if (link.path === "/fees") {
                sessionStorage.setItem(
                  "feesReturnPath",
                  location.pathname
                )
              }

              if (link.path === "/teacher-payments") {
                sessionStorage.setItem(
                  "teacherPaymentsReturnPath",
                  location.pathname
                )
              }

              if (link.path === "/notifications") {
                sessionStorage.setItem(
                  "notificationsReturnPath",
                  location.pathname
                )
              }
            }}
          >
            {link.label === "Notifications" ? (
              <span className="sidebar-notification-item">
                <span>Notifications</span>

                {unreadNotifications > 0 && (
                  <span className="sidebar-notification-badge">
                    {unreadNotifications}
                  </span>
                )}
              </span>
            ) : link.label === "Help & Support" ? (
              <span className="sidebar-support-item">
                <span>Help & Support</span>

                <svg
                  className="sidebar-support-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5Z" />
                  <path d="M8 10h.01M12 10h.01M16 10h.01" />
                </svg>
              </span>
            ) : (
              link.label
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar