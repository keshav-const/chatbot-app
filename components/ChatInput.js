'use client'

import { useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'

export default function ChatInput({ addMessageToHistory }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useUser()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || !user) return
    
    setLoading(true)
    
    try {
      // Add message to UI immediately for better UX
      const userMessage = {
        id: Date.now().toString(), // Temporary ID until we get response
        content: message,
        is_user: true,
        created_at: new Date().toISOString(),
        user_id: user.id
      }
      
      addMessageToHistory(userMessage)
      setMessage('')
      
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      
      // Add bot response to history
      const botMessage = {
        id: data.id || `bot-${Date.now()}`,
        content: data.response,
        is_user: false,
        created_at: new Date().toISOString(),
        user_id: user.id
      }
      
      addMessageToHistory(botMessage)
    } catch (error) {
      console.error('Error sending message:', error)
      // Optionally show error to user
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          disabled={loading || !user}
        />
        <button
          type="submit"
          disabled={loading || !message.trim() || !user}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  )
}