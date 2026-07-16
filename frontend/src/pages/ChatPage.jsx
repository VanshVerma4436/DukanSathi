import { useEffect, useRef, useState } from 'react'
import ChatMessage from '../components/ChatMessage'
import LoadingDots from '../components/LoadingDots'
import { sendQuestion } from '../services/api'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm DukanSathi 👋\n\nI can answer questions about your products, warranties, shipping policies, returns, and more — directly from your uploaded documents.\n\nUpload PDFs in the sidebar, then ask me anything!",
  sources: [],
}

const SUGGESTION_QUESTIONS = [
  'What is the warranty period?',
  'How do I return a product?',
  'What are the shipping options?',
  'How do I install the product?',
]

let msgCounter = 0
const nextId = () => `msg-${++msgCounter}`

export default function ChatPage({ hasDocuments }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (questionText) => {
    const q = (questionText ?? input).trim()
    if (!q || loading) return

    setInput('')
    setLoading(true)

    const userMsg = { id: nextId(), role: 'user', content: q }
    setMessages((prev) => [...prev, userMsg])

    try {
      const data = await sendQuestion(q)
      const aiMsg = {
        id: nextId(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errText =
        err.response?.data?.detail ||
        err.message ||
        'Something went wrong. Please try again.'
      const errMsg = {
        id: nextId(),
        role: 'assistant',
        content: errText,
        sources: [],
        isError: true,
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-surface-600 glass flex-shrink-0">
        <div>
          <h2 className="text-white font-semibold text-base">Chat with your documents</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasDocuments
              ? 'Documents loaded — ask anything'
              : 'Upload PDFs in the sidebar to get started'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Doc status badge */}
          <span
            className={`badge ${
              hasDocuments
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {hasDocuments ? '● Ready' : '○ No docs'}
          </span>
          {/* Clear chat */}
          <button
            onClick={clearChat}
            className="btn-ghost text-xs py-1.5 px-3"
            id="clear-chat-btn"
            title="Clear conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && hasDocuments && (
        <div className="px-6 pb-3 flex gap-2 flex-wrap animate-fade-in">
          {SUGGESTION_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-700 border border-surface-600
                         text-gray-400 hover:text-white hover:border-brand-500/50 transition-all duration-150"
              id={`suggestion-${q.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-6 pb-6 flex-shrink-0">
        <div className="flex gap-3 items-end glass rounded-2xl p-3 border border-surface-600 focus-within:border-brand-500/60 transition-all duration-200">
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              hasDocuments
                ? 'Ask a question about your products…'
                : 'Upload documents first to start chatting…'
            }
            disabled={!hasDocuments || loading}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 text-sm
                       outline-none resize-none leading-relaxed disabled:opacity-40
                       disabled:cursor-not-allowed max-h-32 overflow-y-auto"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || !hasDocuments || loading}
            className="btn-primary flex-shrink-0 py-2 px-4 rounded-xl"
            id="send-btn"
            aria-label="Send message"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
          Press <kbd className="px-1 py-0.5 bg-surface-700 rounded text-gray-500 font-mono text-xs">Enter</kbd> to send  ·  <kbd className="px-1 py-0.5 bg-surface-700 rounded text-gray-500 font-mono text-xs">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  )
}
