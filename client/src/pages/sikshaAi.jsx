import { useEffect, useRef, useState } from "react"
import Sidebar from "../components/sidebar"
import "./sikshaAi.css"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import {
  Sparkles,
  Send,
  UserRound,
  SquarePen,
  BookOpen,
  Wallet,
  CalendarDays,
  Users,
  GraduationCap,
  LoaderCircle,
  AlertCircle
} from "lucide-react"


const API_URL = "https://scms-backend-uhfo.onrender.com/api/ai/chat";
// Role-specific welcome content and suggested questions
const roleContent = {
  admin: {
    description:
      "Ask about students, teachers, fees, finances, reports, and schedules.",

    suggestions: [
      {
        icon: Users,
        text: "How many active students are enrolled?"
      },
      {
        icon: Wallet,
        text: "Show me the November 2026 fee summary."
      },
      {
        icon: GraduationCap,
        text: "Show the November teacher-wise earnings."
      },
      {
        icon: CalendarDays,
        text: "Show me the upcoming class schedules."
      }
    ]
  },

  teacher: {
    description:
      "Ask about your assigned students, class schedules, earnings, payments, and educational topics.",

    suggestions: [
      {
        icon: Users,
        text: "Show me my assigned students."
      },
      {
        icon: CalendarDays,
        text: "What is my class schedule?"
      },
      {
        icon: Wallet,
        text: "Show my November 2026 earnings."
      },
      {
        icon: BookOpen,
        text: "Help me understand a subject or topic."
      }
    ]
  },

  student: {
    description:
      "Your learning companion. Ask about your subjects, class schedules, fee details, or get help with your studies.",

    suggestions: [
      {
        icon: BookOpen,
        text: "Which subjects am I enrolled in?"
      },
      {
        icon: CalendarDays,
        text: "Show me my class schedule."
      },
      {
        icon: Wallet,
        text: "Do I have any outstanding fees?"
      },
      {
        icon: GraduationCap,
        text: "Help me understand a difficult topic."
      }
    ]
  }
}

// Read the logged-in user's role from JWT
const getInitialRole = () => {
  const token = localStorage.getItem("token")

  if (!token) return ""

  try {
    const payload = token.split(".")[1]

    const user = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    )

    return user.role || ""
  } catch (error) {
    return ""
  }
}

function SikshaAI() {
  const [role, setRole] = useState(getInitialRole)
  const [userName, setUserName] = useState("")

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const currentRole = roleContent[role] || roleContent.student

  // Fetch authenticated user details
  useEffect(() => {
    const getUserDetails = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setError("Please log in to use Siksha AI.")
        return
      }

      try {
        const response = await fetch(
          "https://scms-backend-uhfo.onrender.com/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (response.status === 401) {
          setError("Your session has expired. Please log in again.")
          return
        }

        if (response.ok && data.user) {
          setRole(data.user.role || "")
          setUserName(data.user.name || "")
        }
      } catch (error) {
        console.error("Failed to load user details:", error)
      }
    }

    getUserDetails()
  }, [])

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    })
  }, [messages, loading])

  // Start a new conversation
  const handleNewChat = () => {
    if (loading) return

    setMessages([])
    setInput("")
    setError("")
  }

  // Send message to Gemini through the backend
  const sendMessage = async (messageText = input) => {
    const message = messageText.trim()

    if (!message || loading) return

    const token = localStorage.getItem("token")

    if (!token) {
      setError("Your session has expired. Please log in again.")
      return
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: message
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage
    ])

    setInput("")
    setError("")
    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          message
        })
      })

      const data = await response.json()

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        )
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to get a response from Siksha AI."
        )
      }

      // Update role from the authenticated backend response
      if (data.role) {
        setRole(data.role)
      }

      if (!data.response) {
        throw new Error(
          "Siksha AI returned an empty response. Please try again."
        )
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        aiMessage
      ])

    } catch (error) {
      console.error("Siksha AI error:", error)

      setError(
        error.message ||
        "Something went wrong. Please try again."
      )

    } finally {
      setLoading(false)

      textareaRef.current?.focus()
    }
  }

  // Enter sends message; Shift + Enter creates a new line
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  // Send suggested question
  const handleSuggestionClick = (question) => {
    sendMessage(question)
  }

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard-content">

        <div className="page-container siksha-ai-page">

          {/* PAGE HEADER */}
          <div className="page-header siksha-ai-header">

            <div className="siksha-ai-heading">

              <div className="siksha-ai-heading-icon">
                <Sparkles size={24} />
              </div>

              <div>
                <h1>Siksha AI</h1>

                <p>
                  Your smart assistant at Siksham Coaching Center
                </p>
              </div>

            </div>

            <button
              type="button"
              className="siksha-ai-new-chat"
              onClick={handleNewChat}
              disabled={loading || messages.length === 0}
            >
              <SquarePen size={17} />
              <span>New Chat</span>
            </button>

          </div>

          {/* CHAT CONTAINER */}
          <div className="siksha-ai-chat-container">

            {/* WELCOME SCREEN */}
            {messages.length === 0 && (

              <div className="siksha-ai-welcome">

      

                <h2>
                  Namaste{userName ? `, ${userName}` : ""}!
                </h2>

                <h3>
                  I'm Siksha AI
                </h3>

                <p className="siksha-ai-welcome-description">
                  {currentRole.description}
                </p>

                <div className="siksha-ai-role-label">

                  <span className="siksha-ai-status-dot" />

                  {role
                    ? `${role.charAt(0).toUpperCase()}${role.slice(1)} Assistant`
                    : "Your Smart Assistant"}

                </div>

                {/* SUGGESTED QUESTIONS */}
                <div className="siksha-ai-suggestions">

                  <h4>Try asking</h4>

                  <div className="siksha-ai-suggestion-grid">

                    {currentRole.suggestions.map((suggestion) => {

                      const Icon = suggestion.icon

                      return (
                        <button
                          type="button"
                          key={suggestion.text}
                          className="siksha-ai-suggestion"
                          onClick={() =>
                            handleSuggestionClick(suggestion.text)
                          }
                          disabled={loading}
                        >
                          <Icon size={19} />

                          <span>
                            {suggestion.text}
                          </span>

                        </button>
                      )
                    })}

                  </div>

                </div>

              </div>
            )}

            {/* CONVERSATION MESSAGES */}
            {messages.length > 0 && (

              <div className="siksha-ai-messages">

                {messages.map((message) => (

                  <div
                    key={message.id}
                    className={`siksha-ai-message ${
                      message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >

                    <div className="siksha-ai-avatar">

                      {message.role === "user" ? (
                        <UserRound size={19} />
                      ) : (
                        <Sparkles size={19} />
                      )}

                    </div>
                    <div className="siksha-ai-message-content">

                      <span className="siksha-ai-message-name">
                        {message.role === "user"
                          ? "You"
                          : "Siksha AI"}
                      </span>

                      <div className="siksha-ai-message-text">
                          {message.role === "assistant" ? (
                       <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                           >
                              {message.content}
                        </ReactMarkdown>
                             ) : (
                            message.content
                         )}
                      </div>  

                    </div>

                  </div>

                ))}

                {/* AI THINKING INDICATOR */}
                {loading && (

                  <div className="siksha-ai-message assistant-message">

                    <div className="siksha-ai-avatar">
                      <Sparkles size={19} />
                    </div>

                    <div className="siksha-ai-message-content">

                      <span className="siksha-ai-message-name">
                        Siksha AI
                      </span>

                      <div className="siksha-ai-typing">
                        <span />
                        <span />
                        <span />
                      </div>

                    </div>

                  </div>

                )}

                <div ref={messagesEndRef} />

              </div>

            )}

            {/* ERROR MESSAGE */}
            {error && (

              <div className="siksha-ai-error">

                <AlertCircle size={17} />

                <span>{error}</span>

              </div>

            )}

            {/* MESSAGE INPUT */}
            <div className="siksha-ai-input-area">

              <div className="siksha-ai-input-box">

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Siksha AI..."
                  rows={1}
                  disabled={loading}
                  maxLength={2000}
                  aria-label="Message Siksha AI"
                />

                <button
                  type="button"
                  className="siksha-ai-send-button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  title="Send message"
                >

                  {loading ? (
                    <LoaderCircle
                      size={20}
                      className="ai-spin"
                    />
                  ) : (
                    <Send size={19} />
                  )}

                </button>

              </div>

              <div className="siksha-ai-input-footer">

                <span>
                  <Sparkles size={13} />
                  Powered by Gemini
                </span>

                <span>
                  Enter to send · Shift + Enter for a new line
                </span>

              </div>

            </div>

          </div>

          {/* DISCLAIMER */}
          <p className="siksha-ai-disclaimer">
            Siksha AI can make mistakes. Please verify important
            information with the coaching center.
          </p>

        </div>

      </main>

    </div>
  )
}

export default SikshaAI
