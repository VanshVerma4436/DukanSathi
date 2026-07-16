import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import { checkHealth } from './services/api'

export default function App() {
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [apiReady, setApiReady] = useState(false)

  // Poll backend health on mount
  useEffect(() => {
    const probe = async () => {
      try {
        const data = await checkHealth()
        setApiReady(data.status === 'ok')
        if (data.vector_store_loaded && data.document_count > 0) {
          // Backend already has documents loaded — signal UI
          setUploadedDocs((prev) =>
            prev.length === 0 ? ['(Previously uploaded)'] : prev
          )
        }
      } catch {
        setApiReady(false)
      }
    }
    probe()
    const interval = setInterval(probe, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleUploadSuccess = (fileNames) => {
    setUploadedDocs((prev) => {
      const clean = prev.filter((d) => d !== '(Previously uploaded)')
      const merged = new Set([...clean, ...fileNames])
      return Array.from(merged)
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Ambient gradient blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-700/20 blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-80 h-80 rounded-full bg-brand-600/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-brand-800/20 blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar
        onUploadSuccess={handleUploadSuccess}
        uploadedDocs={uploadedDocs}
        apiReady={apiReady}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <ChatPage hasDocuments={uploadedDocs.length > 0} />
      </main>
    </div>
  )
}
