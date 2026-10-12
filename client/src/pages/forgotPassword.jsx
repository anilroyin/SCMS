
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./forgotPassword.css"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")
    setError(false)
    setLoading(true)

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(true)
      }

      setMessage(data.message || "Unable to process your request")
    } catch (error) {
      setError(true)
      setMessage("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="forgot-header">
          <h1>Forgot Password?</h1>
          <p>
            Enter your registered email address and we'll send you
            a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your registered email"
              required
            />
          </div>

          {message && (
            <p className={error ? "forgot-message error" : "forgot-message success"}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className="forgot-button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <button
          type="button"
          className="back-to-login"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword
