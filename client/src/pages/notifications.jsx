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
  const [currentUserId, setCurrentUserId] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
            .replace(/_/g, "/")
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
      setCurrentUserId(user.userId)

      if (user.role === "admin") {
        const response = await fetch(
          "http://localhost:3000/api/notifications/logs",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to get notifications"
          )
        }

        setNotifications(data)
        return
      }

      const receivedResponse = await fetch(
        "http://localhost:3000/api/notifications/me",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const receivedData =
        await receivedResponse.json()

      if (!receivedResponse.ok) {
        throw new Error(
          receivedData.message ||
            "Failed to get notifications"
        )
      }

      const receivedNotifications =
        Array.isArray(receivedData)
          ? receivedData
          : receivedData.notifications || []

      if (user.role === "teacher") {
        const sentResponse = await fetch(
          "http://localhost:3000/api/notifications/sent",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const sentData = await sentResponse.json()

        if (!sentResponse.ok) {
          throw new Error(
            sentData.message ||
              "Failed to get sent notifications"
          )
        }

        const sentNotifications =
          Array.isArray(sentData)
            ? sentData
            : sentData.notifications || []

        const allNotifications = [
          ...receivedNotifications,
          ...sentNotifications
        ]

        const uniqueNotifications = Array.from(
          new Map(
            allNotifications.map((notification) => [
              notification._id,
              notification
            ])
          ).values()
        )

        uniqueNotifications.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )

        setNotifications(uniqueNotifications)
        return
      }

      setNotifications(receivedNotifications)
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
          data.message ||
            "Failed to mark notification as read"
        )
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )

      window.dispatchEvent(
        new Event("notificationsUpdated")
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
          data.message ||
            "Failed to mark notification as read"
        )
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, adminRead: true }
            : notification
        )
      )

      window.dispatchEvent(
        new Event("notificationsUpdated")
      )

      return true
    } catch (error) {
      setMessage(error.message)
      return false
    }
  }

  const deleteNotification = async () => {
    if (!selectedNotification) {
      return
    }

    setDeleteLoading(true)

    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/${selectedNotification._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete notification"
        )
      }

      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (item) =>
            item._id !== selectedNotification._id
        )
      )

      setShowDeleteModal(false)
      setSelectedNotification(null)

      window.dispatchEvent(
        new Event("notificationsUpdated")
      )
    } catch (error) {
      setMessage(error.message)
      setShowDeleteModal(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (
      isAdmin &&
      !notification.adminRead
    ) {
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

    if (
      !isAdmin &&
      !notification.isSent &&
      !notification.isRead
    ) {
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
      teacher_individual_student:
        "Individual Student"
    }

    return targetNames[targetType] || targetType
  }

  const canDeleteSelectedNotification =
    selectedNotification &&
    (
      (
        role === "admin" &&
        selectedNotification.sender?.role ===
          "admin" &&
        selectedNotification.sender?._id ===
          currentUserId
      ) ||
      (
        role === "teacher" &&
        selectedNotification.sender?._id ===
          currentUserId
      )
    )

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          <div className="notifications-page">
            <div className="notifications-loading">
              Loading notifications...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (selectedNotification) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
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

              <div className="notifications-header-actions">
                {canDeleteSelectedNotification && (
                  <button
                    className="notifications-delete-button"
                    onClick={() =>
                      setShowDeleteModal(true)
                    }
                  >
                    Delete
                  </button>
                )}

                <button
                  className="notifications-back-button"
                  onClick={() =>
                    setSelectedNotification(null)
                  }
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

            <div className="notification-detail-card">
              <div className="notification-detail-header">
                <h2>
                  {selectedNotification.title}
                </h2>
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

                {(isAdmin ||
                  selectedNotification.isSent) && (
                  <div>
                    <strong>Target:</strong>
                    <span>
                      {getTargetName(
                        selectedNotification.targetType
                      )}
                    </span>
                  </div>
                )}

                {selectedNotification.className && (
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
                <p>
                  {selectedNotification.message}
                </p>
              </div>

              {(isAdmin ||
                selectedNotification.isSent) && (
                <div className="notification-recipients">
                  <div className="notification-recipients-header">
                    <strong>Recipients</strong>
                    <span>
                      {selectedNotification.recipients?.length ||
                        0}
                    </span>
                  </div>

                  {selectedNotification.recipients?.length >
                  0 ? (
                    <div className="notification-recipient-list">
                      {selectedNotification.recipients.map(
                        (recipient) => (
                          <div
                            className="notification-recipient"
                            key={recipient._id}
                          >
                            <div>
                              <strong>
                                {recipient.name}
                              </strong>

                              <span>
                                {recipient.email}
                              </span>
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
        </main>

        {showDeleteModal && (
          <div
            className="notification-modal-overlay"
            onClick={() =>
              !deleteLoading &&
              setShowDeleteModal(false)
            }
          >
            <div
              className="notification-delete-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h2>Delete Notification</h2>

              <p>
                Are you sure you want to delete this
                notification?
              </p>

              <div className="notification-modal-actions">
                <button
                  className="notification-modal-cancel"
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  disabled={deleteLoading}
                >
                  Cancel
                </button>

                <button
                  className="notification-modal-delete"
                  onClick={deleteNotification}
                  disabled={deleteLoading}
                >
                  {deleteLoading
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
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
                onClick={() => navigate(-1)}
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
                      : notification.isSent
                        ? "read"
                        : notification.isRead
                          ? "read"
                          : "unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
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
                      !notification.isSent &&
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
                          {notification.isSent
                            ? "Sent"
                            : notification.isRead
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
      </main>
    </div>
  )
}

export default Notifications