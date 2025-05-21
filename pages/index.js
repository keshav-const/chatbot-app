
import { useEffect, useState, useCallback, useRef } from 'react'
//import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import Header from '../components/Header'

export default function ChatbotPage() {
  //const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pdfText, setPdfText] = useState('')
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const isMounted = useRef(false)
  const historyFetched = useRef(false)

  const safeSetState = useCallback((setter, value) => {
    if (isMounted.current) {
      setter(value)
    }
  }, [])

  const fetchHistory = async (attempt = 1) => {
    if (historyFetched.current) return

    try {
      if (attempt === 1) safeSetState(setHistoryLoading, true)

      const res = await fetch('/api/history')
      if (res.status === 401 && attempt <= 6) {
        console.warn('🔁 Session not ready, retrying...')
        return setTimeout(() => fetchHistory(attempt + 1), 1500)
      }

      if (!res.ok) throw new Error(`Status: ${res.status}`)

      const data = await res.json()
      if (Array.isArray(data.history)) {
        safeSetState(setHistory, data.history)
        historyFetched.current = true
      }
    } catch (err) {
      console.error('❌ Failed to fetch history:', err.message)
    } finally {
      safeSetState(setHistoryLoading, false)
    }
  }

  useEffect(() => {
    isMounted.current = true
    setMounted(true)
    fetchHistory()
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        safeSetState(setPdfText, data.text)
      } else {
        console.error('Upload error:', data.error)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const askQuestion = async () => {
    if (!query.trim() || !pdfText.trim()) return

    const currentQuery = query
    safeSetState(setLoading, true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: pdfText, question: currentQuery }),
      })

      const data = await res.json()
      if (res.ok) {
        safeSetState(setResponse, data.reply)
        safeSetState(setQuery, '')

        const newItem = {
          id: data.id || Date.now(),
          question: currentQuery,
          response: data.reply,
          created_at: new Date().toISOString(),
        }

        safeSetState(setHistory, (prev) => [newItem, ...prev])
        historyFetched.current = false
        setTimeout(() => {
          if (isMounted.current) fetchHistory()
        }, 2000)
      } else {
        safeSetState(setResponse, 'Error: ' + (data.error || 'Something went wrong'))
      }
    } catch (err) {
      console.error('Ask failed:', err)
      safeSetState(setResponse, 'Something went wrong while contacting the server.')
    }

    safeSetState(setLoading, false)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen p-6 bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-all">
      <Header />

      <h1 className="text-2xl font-bold mb-4">📄 PDF Chatbot (Gemini API)</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="mb-4 border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-white text-black dark:bg-gray-800 dark:text-white"
      />

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask something from the PDF..."
        className="w-full border border-gray-400 dark:border-gray-600 rounded p-3 mb-4 bg-white text-black dark:bg-gray-800 dark:text-white"
        rows={3}
      />

      <button
        onClick={askQuestion}
        disabled={loading || !pdfText.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Asking...' : 'Ask'}
      </button>

      {response && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-100 dark:bg-green-900 p-4 mt-4 rounded"
        >
          <strong>Response:</strong>
          <p>{response}</p>
        </motion.div>
      )}

      <h2 className="text-xl font-semibold mt-8">🕓 Chat History</h2>
      {historyLoading && <p className="text-gray-500 dark:text-gray-400 mt-2">Loading history...</p>}

      {!historyLoading && history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No chat history yet</p>
      ) : (
        <ul className="space-y-4 mt-2">
          {history.map((item, i) => (
            <motion.li
              key={item.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border p-4 rounded dark:bg-gray-800 bg-gray-100"
            >
              <p><strong>Q:</strong> {item.question}</p>
              <p><strong>A:</strong> {item.response}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
