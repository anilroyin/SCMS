
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import "./resetPassword.css"

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [redirectToLogin, setRedirectToLogin] = useState(false)

  useEffect(() => {
  if (!redirectToLogin) return

  const timer = setTimeout(() => {
    navigate("/login")
  }, 3000)

  return () => clearTimeout(timer)
  }, [redirectToLogin, navigate])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")
    setError(false)

    if (password.length < 8) {
      setError(true)
      setMessage("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError(true)
      setMessage("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            newPassword: password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(true)
      }

      setMessage(data.message || "Unable to reset password")

      if (response.ok) {
        setPassword("")
        setConfirmPassword("")
        setRedirectToLogin(true)
      }
    } catch (error) {
      setError(true)
      setMessage("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-header">
          <h1>Reset Password</h1>
          <p>Enter and confirm your new password.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>

            <div className="reset-password-field">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>

            <div className="reset-password-field">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {message && (
            <p className={`reset-message ${error ? "error" : "success"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && !error && (
          <button
            type="button"
            className="reset-back-button"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
