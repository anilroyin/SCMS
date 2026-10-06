import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./notifications.css"

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [role, setRole] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const token = localStorage.getItem("token")

  const getUserFromToken = () => {
    try {
      if (!token) {
        return null
      }

      const payload = token.split(".")[1]

      return JSON.parse(
        atob(
          payload
            .replace(/-/g, "+")
            .replace(/\_/g, "/")
        )
      )
    } catch (error) {
      return null
    }
  }

  const getNotifications = async () => {
    try {
      const user = getUserFromToken()

      if (!user) {
        throw new Error("Invalid authentication token")
      }

      setRole(user.role)
      setIsAdmin(user.role === "admin")

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
        throw new Error(
          data.message || "Failed to get notifications"
        )
      }

      setNotifications(data)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getNotifications()
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        )
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )

      return true
    } catch (error) {
      setMessage(error.message)
      return false
    }
  }

  const markAdminAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/${notificationId}/admin-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        )
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, adminRead: true }
            : notification
        )
      )

      return true
    } catch (error) {
      setMessage(error.message)
      return false
    }
  }

  const handleNotificationClick = async (notification) => {
    if (isAdmin && !notification.adminRead) {
      const markedAsRead = await markAdminAsRead(
        notification._id
      )

      if (markedAsRead) {
        setSelectedNotification({
          ...notification,
          adminRead: true
        })
        return
      }
    }

    if (!isAdmin && !notification.isRead) {
      await markAsRead(notification._id)

      setSelectedNotification({
        ...notification,
        isRead: true
      })
      return
    }

    setSelectedNotification(notification)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getTargetName = (targetType) => {
    const targetNames = {
      everyone: "Everyone",
      all_students: "All Students",
      all_teachers: "All Teachers",
      fee_due: "Fee Due Students",
      fee_partial: "Fee Partial Students",
      individual_student: "Individual Student",
      individual_teacher: "Individual Teacher",
      teacher_students: "All Own Students",
      teacher_class: "Class-wise Students",
      teacher_individual_student: "Individual Student"
    }

    return targetNames[targetType] || targetType
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading">
          Loading notifications...
        </div>
      </div>
    )
  }

  if (selectedNotification) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <div>
            <h1>
              {isAdmin
                ? "Notification Details"
                : "Notification"}
            </h1>

            <p>View notification details</p>
          </div>

          <button
            className="notifications-back-button"
            onClick={() =>
              setSelectedNotification(null)
            }
          >
            Back
          </button>
        </div>

        <div className="notification-detail-card">
          <div className="notification-detail-header">
            <h2>{selectedNotification.title}</h2>
          </div>

          <div className="notification-detail-info">
            <div>
              <strong>From:</strong>
              <span>
                {selectedNotification.sender?.name ||
                  "Unknown"}
              </span>
            </div>

            <div>
              <strong>Role:</strong>
              <span>
                {selectedNotification.sender?.role ||
                  selectedNotification.senderRole ||
                  "-"}
              </span>
            </div>

            <div>
              <strong>Date:</strong>
              <span>
                {formatDate(
                  selectedNotification.createdAt
                )}
              </span>
            </div>

            {isAdmin && (
              <div>
                <strong>Target:</strong>
                <span>
                  {getTargetName(
                    selectedNotification.targetType
                  )}
                </span>
              </div>
            )}

            {isAdmin &&
              selectedNotification.className && (
                <div>
                  <strong>Class:</strong>
                  <span>
                    {selectedNotification.className}
                  </span>
                </div>
              )}
          </div>

          <div className="notification-detail-message">
            <strong>Message</strong>
            <p>{selectedNotification.message}</p>
          </div>

          {isAdmin && (
            <div className="notification-recipients">
              <div className="notification-recipients-header">
                <strong>Recipients</strong>
                <span>
                  {selectedNotification.recipients?.length ||
                    0}
                </span>
              </div>

              {selectedNotification.recipients?.length > 0 ? (
                <div className="notification-recipient-list">
                  {selectedNotification.recipients.map(
                    (recipient) => (
                      <div
                        className="notification-recipient"
                        key={recipient._id}
                      >
                        <div>
                          <strong>{recipient.name}</strong>
                          <span>{recipient.email}</span>
                        </div>

                        <span className="notification-recipient-role">
                          {recipient.role}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="notification-no-recipients">
                  No recipients found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>
            {isAdmin
              ? "Notification Log"
              : "Notifications"}
          </h1>

          <p>
            {isAdmin
              ? "Complete record of notifications sent by the admin and teachers"
              : "View your latest notifications"}
          </p>
        </div>

        <div className="notifications-header-actions">
          {(isAdmin || role === "teacher") && (
            <button
              className="notifications-send-button"
              onClick={() =>
                navigate("/notifications/send")
              }
            >
              Send Notification
            </button>
          )}

          <button
            className="notifications-back-button"
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </div>

      {message && (
        <div className="notifications-message">
          {message}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          {isAdmin
            ? "No notification records found."
            : "No notifications found."}
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-card ${
                isAdmin
                  ? `admin-notification ${
                      !notification.adminRead
                        ? "admin-new"
                        : ""
                    }`
                  : notification.isRead
                    ? "read"
                    : "unread"
              }`}
              onClick={() =>
                handleNotificationClick(notification)
              }
            >
              <div className="notification-card-header">
                <div>
                  <h2>
                    <span className="notification-title-text">
                      {notification.title}
                    </span>

                    {isAdmin &&
                      !notification.adminRead && (
                        <span className="notification-admin-new-badge">
                          New
                        </span>
                      )}
                  </h2>

                  <span className="notification-sender">
                    {`From: ${
                      notification.sender?.name ||
                      "Unknown"
                    }`}
                  </span>
                </div>

                {isAdmin ? (
                  <span className="notification-target">
                    {getTargetName(
                      notification.targetType
                    )}
                  </span>
                ) : (
                  !notification.isRead && (
                    <span className="notification-unread">
                      Unread
                    </span>
                  )
                )}
              </div>

              <p className="notification-message">
                {notification.message}
              </p>

              <div className="notification-footer">
                {isAdmin ? (
                  <>
                    <span>
                      Recipients:{" "}
                      {notification.recipients?.length ||
                        0}
                    </span>

                    <span>
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {notification.isRead
                        ? "Read"
                        : "Unread"}
                    </span>

                    <span>
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications