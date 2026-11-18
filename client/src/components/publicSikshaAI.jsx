import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, Send, Sparkles, SquarePen} from "lucide-react";
import "./publicSikshaAI.css";
import { useNavigate } from "react-router-dom";

const API_URL = "https://scms-backend-uhfo.onrender.com/api/ai/public-chat";

function PublicSikshaAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = () => {
    if (loading) return;

    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    const userMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to get a response from Siksha AI."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content:
            error.message ||
            "Siksha AI is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="public-ai-container">
      <div className="public-ai-header">
        <div className="public-ai-title">
          <div className="public-ai-icon">
            <Sparkles size={25} />
          </div>

          <div>
            <h2>Siksha AI</h2>
            <p>SCMS Smart AI Assistant</p>
          </div>
        </div>

        <button
          type="button"
          className="public-ai-new-chat"
          onClick={handleNewChat}
          disabled={loading}
        >
          <SquarePen size={17} />
          <span>New Chat</span>
        </button>
        <button
         type="button"
           className="public-ai-back-btn"
           onClick={() => navigate("/login")}
          title="Back"
         >
         <ChevronLeft size={17} />
          <span>Back</span>
        </button>
      </div>

      <div className="public-ai-messages">
        {messages.length === 0 ? (
          <div className="public-ai-welcome">
            
            <h3>Hello!</h3>

            <p>
              I'm Siksha AI, your public assistant for Smart
              Coaching Management System. Ask me about SCMS features,
              modules, functionality, and technology.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`public-ai-message public-ai-${message.role}`}
            >
              {message.role === "assistant" ? (
                <div className="public-ai-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="public-ai-loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="public-ai-input-area" onSubmit={handleSend}>
        <div className="public-ai-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about SCMS..."
            maxLength={2000}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="public-ai-disclaimer">
          Siksha AI can make mistakes. Please verify important information.
        </p>
      </form>
    </div>
  );
}

export default PublicSikshaAI;
