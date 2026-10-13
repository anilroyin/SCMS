
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const INACTIVITY_LIMIT = 25* 60 * 1000

function SessionTimeout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return
    }

    let timeout

    const logout = () => {
      localStorage.setItem("sessionExpired", "true")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      navigate("/login", { replace: true })
    }

    const resetTimeout = () => {
      clearTimeout(timeout)

      if (!localStorage.getItem("token")) {
        return
      }

      timeout = setTimeout(logout, INACTIVITY_LIMIT)
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimeout, { passive: true })
    })

    resetTimeout()

    return () => {
      clearTimeout(timeout)

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimeout)
      })
    }
  }, [navigate, location.pathname])

  return null
}

export default SessionTimeout