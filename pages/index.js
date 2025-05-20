import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

export default function ChatbotPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [pdfText, setPdfText] = useState('')
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    const res = await fetch('/api/history')
    const data = await res.json()
    setHistory(data.history || [])
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('pdf', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setPdfText(data.text)
  }

  const askQuestion = async () => {
    if (!query.trim() || !pdfText.trim()) return
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: pdfText, question: query }),
    })

    const data = await res.json()
    setResponse(data.reply)
    setQuery('')
    fetchHistory()
    setLoading(false)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen p-6 dark:bg-gray-900 dark:text-white bg-white text-gray-800 transition-all">
      {/* Theme Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
        >
          {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">📄 PDF Chatbot (Gemini API)</h1>
        
      {/* PDF Upload */}
      <input
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="mb-4 border border-gray-300 p-2 rounded w-full"
      />

      {/* Question Input */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask something from the PDF..."
        className="w-full border border-gray-400 rounded p-3 mb-4 dark:bg-gray-800"
        rows={3}
      />

      <button
        onClick={askQuestion}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Asking...' : 'Ask'}
      </button>

      {/* Chatbot Response */}
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

      {/* Chat History */}
      <h2 className="text-xl font-semibold mt-8">🕓 Chat History</h2>
      <ul className="space-y-4 mt-2">
        {history.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border p-4 rounded dark:bg-gray-800 bg-gray-100"
          >
            <p><strong>Q:</strong> {item.question}</p>
            <p><strong>A:</strong> {item.response}</p>
            <p className="text-xs text-gray-500 italic">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
