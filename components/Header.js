'use client'

import { useTheme } from 'next-themes'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation' // Changed from next/router
import { useState, useEffect } from 'react'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Don't render anything until client-side hydration is complete
  if (!mounted) return null

  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-xl font-bold">📄 PDF Chatbot</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
        >
          {mounted && theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
        </button>

        {/* User Avatar */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-white"
            >
              {user.email?.[0]?.toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}