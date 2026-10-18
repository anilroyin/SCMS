import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  BookOpen,
  IndianRupee,
  ChartNoAxesColumnIncreasing,
  Mail,
  Lock,
  Wallet,
  Headset
} from "lucide-react"
import "./login.css"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem("sessionExpired") === "true") {
      setMessage("Your session has expired! Please log in again.")
      localStorage.removeItem("sessionExpired")
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()

    if (loading) return

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("https://scms-backend-uhfo.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || "Unable to log in. Please try again.")
        return
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      navigate("/")
    } catch (error) {
      setMessage("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: "Manage Students",
      description: "Student records and profiles"
    },
    {
      icon: GraduationCap,
      title: "Manage Teachers",
      description: "Teacher profiles and assigned students"
    },
    {
      icon: BookOpen,
      title: "Organise Classes",
      description: "Subjects and class schedules"
    },
    {
      icon: IndianRupee,
      title: "Track Fees",
      description: "Fee collection, discounts and dues"
    },
    {
      icon: Wallet,
      title: "Generate Fee Receipts",
      description: "Record and verify fee payments"
    },
    {
      icon: IndianRupee,
      title: "Manage Teacher Payments",
      description: "Commissions and teacher earnings"
    },
    {
      icon: Headset,
      title: "AI Help & Support",
      description: "Assistance for students"
    },
    {
      icon: ChartNoAxesColumnIncreasing,
      title: "Reports & Dashboard",
      description: "Coaching and financial summaries"
    }
  ]

  return (
    <div className="login-page">
      <main className="login-main">
        <section className="login-intro">
          <div className="login-brand">
            <div className="brand-icon-wrap">
              <GraduationCap className="brand-icon" size={44} strokeWidth={1.8} />
            </div>
            <h1>SCMS</h1>
            <p className="brand-subtitle">
              Smart Coaching Management System
            </p>
          </div>

          <div className="login-features">
            <h2>
              Manage your coaching centre,
              <br />
              all in one place.
            </h2>

            <p className="features-description">
              A simpler way to manage students, teachers, classes and finances.
            </p>

            <div className="feature-list">
              {features.map((feature) => {
                const FeatureIcon = feature.icon

                return (
                  <div className="feature-item" key={feature.title}>
                    <div className="feature-icon">
                      <FeatureIcon size={23} strokeWidth={1.9} />
                    </div>

                    <div className="feature-text">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access your SCMS account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <div className="login-input-wrap">
                <Mail size={19} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrap password-field">
                <Lock size={19} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {message && (
              <p className="login-message" role="alert">
                {message}
              </p>
            )}

            <div className="forgot-password">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Please wait, signing in..." : "Login"}
            </button>
          </form>
        </section>
      </main>

      <footer className="page-footer">
        <p>© 2026 SCMS. All rights reserved.</p>

        <nav className="footer-links" aria-label="Footer navigation">
          <button
            type="button"
            onClick={() => navigate("/privacy-policy")}
          >
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => navigate("/terms-of-service")}
          >
            Terms of Service
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact-developer")}
          >
            Contact Developer
          </button>
        </nav>
      </footer>
    </div>
  )
}

export default Login
