import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // LLM can be slow on free tier
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export const checkHealth = async () => {
  const { data } = await api.get('/health')
  return data
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload one or more PDF files.
 * @param {File[]} files - Array of File objects
 * @param {(progress: number) => void} onProgress - Upload progress callback (0-100)
 */
export const uploadDocuments = async (files, onProgress) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
  return data
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/**
 * Send a question to the RAG pipeline.
 * @param {string} question
 * @returns {{ answer: string, sources: Array<{document: string, page: number, content: string}> }}
 */
export const sendQuestion = async (question) => {
  const { data } = await api.post('/chat', { question })
  return data
}

export default api
