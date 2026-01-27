import { useState, useEffect } from 'react'
import * as api from '../services/api-secure'
import type { Subscriber } from '../services/api-secure'

export default function Admin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterContent, setNewsletterContent] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if admin is already authenticated (in memory only)
    if (api.isAdminAuthenticated()) {
      setIsAuthenticated(true)
      loadSubscribers()
    }
  }, [])

  const loadSubscribers = async () => {
    if (!api.isSupabaseConfigured()) {
      setSubscribers([])
      return
    }

    try {
      setLoading(true)
      const data = await api.getSubscribers()
      setSubscribers(data || [])
    } catch (error) {
      console.error('Failed to load subscribers:', error)
      setSubscribers([])
      // If authentication failed, clear state
      if (error instanceof Error && error.message.includes('authentication')) {
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!api.isSupabaseConfigured()) {
      alert('Supabase is not configured. Admin login requires Supabase.')
      return
    }

    try {
      setLoading(true)
      const result = await api.verifyPassword(password)

      if (result.valid && result.authenticated) {
        setIsAuthenticated(true)
        setPassword('') // Clear password from form
        await loadSubscribers()
      } else {
        alert('Invalid password')
        setPassword('')
      }
    } catch (error: any) {
      alert(error.message || 'Login failed. Please try again.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    api.logout()
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setSubscribers([])
  }

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterSubject || !newsletterContent) {
      alert('Please fill in both subject and content')
      return
    }

    if (!api.isSupabaseConfigured()) {
      alert('Supabase is not configured. Please set up Supabase to send newsletters.')
      return
    }

    if (subscribers.length === 0) {
      alert('No subscribers to send to.')
      return
    }

    setSending(true)

    try {
      const result = await api.sendNewsletter({
        subject: newsletterSubject,
        content: newsletterContent,
        subscribers: subscribers.map(s => s.email),
      })

      alert(`Newsletter sent successfully! Sent: ${result.sent}, Failed: ${result.failed}`)
      setNewsletterSubject('')
      setNewsletterContent('')
    } catch (error: any) {
      alert(`Error sending newsletter: ${error?.message || 'Please try again.'}`)
      // If authentication failed, clear state
      if (error.message?.includes('authentication')) {
        setIsAuthenticated(false)
      }
    } finally {
      setSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6">Admin Login</h1>
          {!api.isSupabaseConfigured() && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Supabase is not configured. See README.md for setup instructions.
              </p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {!api.isSupabaseConfigured() && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Note:</strong> Supabase is not configured. Newsletter features require Supabase setup. 
              See README.md for setup instructions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscribers List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Newsletter Subscribers</h2>
            <p className="text-gray-600 mb-4">Total: {subscribers.length}</p>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading subscribers...</p>
            ) : !api.isSupabaseConfigured() ? (
              <p className="text-gray-500 text-sm">Configure Supabase to see subscribers.</p>
            ) : subscribers.length === 0 ? (
              <p className="text-gray-500 text-sm">No subscribers yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <ul className="space-y-2">
                  {subscribers.map((subscriber) => (
                    <li key={subscriber.id} className="p-2 bg-gray-50 rounded">
                      {subscriber.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Newsletter Composer */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Send Newsletter</h2>
            <form onSubmit={handleSendNewsletter} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={newsletterSubject}
                  onChange={(e) => setNewsletterSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content (HTML supported)
                </label>
                <textarea
                  id="content"
                  rows={12}
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {sending ? 'Sending...' : `Send to ${subscribers.length} Subscribers`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

