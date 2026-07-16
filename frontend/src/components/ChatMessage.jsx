import { useState } from 'react'
import SourceCard from './SourceCard'

/**
 * Renders a single chat message (user or AI).
 * AI messages include collapsible source citations.
 */
export default function ChatMessage({ message }) {
  const [showSources, setShowSources] = useState(true)
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="message-user" id={`msg-${message.id}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {/* User avatar */}
        <div className="w-8 h-8 rounded-xl bg-surface-600 border border-surface-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      </div>
    )
  }

  // AI message
  return (
    <div className="flex items-start gap-3 group">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {/* Answer bubble */}
        <div className="message-ai" id={`msg-${message.id}`}>
          {message.isError ? (
            <p className="text-red-400 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Sources section */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 ml-0">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors duration-150 mb-2"
              aria-expanded={showSources}
              id={`sources-toggle-${message.id}`}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showSources ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {showSources ? 'Hide' : 'Show'} {message.sources.length} source
              {message.sources.length !== 1 ? 's' : ''}
            </button>

            {showSources && (
              <div className="space-y-2 animate-fade-in">
                {message.sources.map((src, idx) => (
                  <SourceCard key={idx} source={src} index={idx} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
