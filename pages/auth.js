import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

 const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  console.log('Attempting to submit form...', { email, password })

  let result
  if (isLogin) {
    result = await supabase.auth.signInWithPassword({ email, password })
  } else {
    result = await supabase.auth.signUp({ email, password })
  }

  const { error, data } = result
  console.log('Supabase response:', result)

  if (error) {
    setError(error.message)
    return
  }

  // Registration: Email confirmation required
  if (!isLogin && data.user && !data.session) {
    alert('✅ Account created! Please confirm your email before logging in.')
    return
  }

  // Login: successful login gives a session
  if (isLogin && data.session) {
  console.log('Login successful! Waiting for session propagation...')

 setTimeout(() => {
  window.location.href = '/'
}, 1000)
 // ⏳ give it 1 second for session cookie to sync
  return
}


  setError('Unexpected state. Try again or check your email.')
}



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? 'Login' : 'Register'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p
          className="mt-4 text-center text-blue-500 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need to register?' : 'Already have an account?'}
        </p>
      </div>
    </div>
  )
}
