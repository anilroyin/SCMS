import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Sidebar from "../components/sidebar"
import "./helpSupport.css"
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Headset } from "lucide-react";

const supportPhone = "7000000510"
const supportEmail = "support@scms.com"
const suggestions = [
  "How can I check my fees?",
  "How can I get my fee receipt?",
  "Where can I find my class schedule?",
  "How can I update my profile?"
]

function getBotResponse(message) {
  const text = message.toLowerCase().trim()

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return {
      answer: "Hello! Welcome to SCMS Help & Support. How can I help you today?",
      fallback: false
    }
  }

  if (
    text.includes("thank") ||
    text.includes("thanks")
  ) {
    return {
      answer: "You're welcome! I'm here to help whenever you need assistance.",
      fallback: false
    }
  }

  if (
    text.includes("fee") ||
    text.includes("payment") ||
    text.includes("due amount")
  ) {
    return {
      answer: "You can check your fee details by opening My Fees from the student sidebar. There you can review the fee information available in your account. If you believe a payment or fee status is incorrect, please contact the support team.",
      fallback: false
    }
  }

  if (
    text.includes("receipt") ||
    text.includes("payment proof") ||
    text.includes("transaction")
  ) {
    return {
      answer: "You can check your payment information under My Fees. If a receipt is not available for a payment, please contact the support team. Receipt generation will be available once that feature is implemented in SCMS.",
      fallback: false
    }
  }

  if (
    text.includes("schedule") ||
    text.includes("timetable") ||
    text.includes("class time") ||
    text.includes("class timing")
  ) {
    return {
      answer: "Open My Schedule from the student sidebar to view the class schedule available to you. If a class or timing is missing or incorrect, contact the support team.",
      fallback: false
    }
  }

  if (
    text.includes("profile") ||
    text.includes("personal details") ||
    text.includes("update my name")
  ) {
    return {
      answer: "Open My Profile from the student sidebar to view your profile information. If you need to correct information that you cannot edit yourself, contact the support team.",
      fallback: false
    }
  }

  if (
    text.includes("login") ||
    text.includes("password") ||
    text.includes("sign in") ||
    text.includes("account")
  ) {
    return {
      answer: "If you cannot log in, check that you are using the correct login credentials. If the problem continues or you need help with your account, contact the support team.",
      fallback: false
    }
  }

  if (
    text.includes("notification") ||
    text.includes("announcement") ||
    text.includes("message")
  ) {
    return {
      answer: "Open Notifications from the sidebar to view announcements and messages available to you.",
      fallback: false
    }
  }

  if (
    text.includes("help") ||
    text.includes("support") ||
    text.includes("contact")
  ) {
    return {
      answer: "You can contact the SCMS support team using the details below.",
      fallback: true
    }
  }

  return {
    answer: "Sorry, I couldn't understand your question. Please contact the SCMS support team for further assistance.",
    fallback: true
  }
}

function HelpSupport() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello! I'm the SCMS Help Assistant. You can ask me about fees, receipts, class schedules, your profile, or login problems."
    }
  ])

  const [input, setInput] = useState("")
  const [messageId, setMessageId] = useState(2)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }, [messages])

  const sendMessage = (question) => {
    const text = question.trim()

    if (!text) {
      return
    }

    const response = getBotResponse(text)

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: messageId,
        sender: "student",
        text
      },
      {
        id: messageId + 1,
        sender: "bot",
        text: response.answer,
        showContact: response.fallback
      }
    ])

    setMessageId((previousId) => previousId + 2)
    setInput("")
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <div className="help-support-page">
          <div className="help-support-header">
            <div>
              <h1><Headset size={22} />Help & Support</h1>
              <p>Find answers to your questions about SCMS.</p>
            </div>

            <button
               className="help-support-back"
               onClick={() => navigate(-1)}
               > <ChevronLeft size={18} /> Back</button>
          </div>

          <section className="support-chat-card">
            <div className="support-chat-header">
              <div className="support-chat-avatar">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
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
              </div>

              <div className="support-chat-heading">
                <h2>SCMS Help Assistant</h2>
                <p>
                  <span className="support-online-dot"></span>
                  Automated support
                </p>
              </div>
            </div>

            <div className="support-chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`support-message-row ${message.sender}`}
                >
                  <div className={`support-message ${message.sender}`}>
                    <p>{message.text}</p>

                    {message.showContact && (
                      <div className="support-contact-details">
                        <a href={`tel:${supportPhone}`}>
                          <span>Mobile:</span> {supportPhone}
                        </a>

                        <a href={`mailto:${supportEmail}`}>
                          <span>Email:</span> {supportEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            <div className="support-suggestions">
              <p>Suggested questions</p>

              <div className="support-suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="support-chat-form"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question..."
                aria-label="Type your support question"
              />

              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>

            <p className="support-chat-note">
              Automated answers may not cover every situation.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

export default HelpSupport