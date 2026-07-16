import { useState, useRef } from 'react'
import { uploadDocuments } from '../services/api'

const ALLOWED_TYPES = ['application/pdf']
const DOC_TYPE_LABELS = [
  'Product Manuals',
  'Warranty Policies',
  'Shipping Policies',
  'Return Policies',
  'Refund Policies',
  'Installation Guides',
  'User Manuals',
  'Product Specs',
  'FAQ Documents',
]

export default function Sidebar({ onUploadSuccess, uploadedDocs, apiReady }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleFiles = async (files) => {
    setError('')
    setSuccess('')

    const pdfs = Array.from(files).filter((f) => ALLOWED_TYPES.includes(f.type))
    if (pdfs.length === 0) {
      setError('Please select PDF files only.')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const result = await uploadDocuments(pdfs, setProgress)
      setSuccess(
        `✓ ${result.files_processed.length} file(s) processed — ${result.total_chunks} chunks indexed.`
      )
      onUploadSuccess(result.files_processed)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Upload failed. Please try again.'
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const onInputChange = (e) => handleFiles(e.target.files)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <aside className="w-72 flex-shrink-0 glass flex flex-col h-full border-r border-surface-600">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-surface-600">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">DukanSathi</h1>
            <p className="text-brand-400 text-xs mt-0.5">AI Store Assistant</p>
          </div>
        </div>
      </div>

      {/* API Status */}
      <div className="px-5 py-3 border-b border-surface-600">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              apiReady ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs text-gray-400">
            {apiReady ? 'Backend connected' : 'Connecting to backend…'}
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-5 py-5 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Upload Documents
        </p>

        {/* Drop zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-surface-500 hover:border-brand-500/60 hover:bg-surface-700/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          aria-label="Upload PDF files"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            id="pdf-upload"
            onChange={onInputChange}
          />
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              dragging ? 'bg-brand-500/20' : 'bg-surface-600'
            }`}>
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Drop PDFs here</p>
              <p className="text-xs text-gray-500 mt-0.5">or click to browse</p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-3 animate-fade-in">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Processing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin-slow" />
              <span className="text-xs text-gray-400">Building vector index…</span>
            </div>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-fade-in">
            <p className="text-xs text-emerald-400">{success}</p>
          </div>
        )}

        {/* Accepted document types */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Accepted Types
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DOC_TYPE_LABELS.map((label) => (
              <span
                key={label}
                className="badge bg-surface-700 text-gray-400 border border-surface-500"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Uploaded documents list */}
        {uploadedDocs.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Indexed Documents
            </p>
            <ul className="space-y-1.5">
              {uploadedDocs.map((doc) => (
                <li
                  key={doc}
                  className="sidebar-item"
                >
                  <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="truncate text-xs" title={doc}>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-600">
        <p className="text-xs text-gray-600 text-center">
          Powered by LangChain · FAISS · OpenRouter
        </p>
      </div>
    </aside>
  )
}
