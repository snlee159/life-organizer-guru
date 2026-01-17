import { useState } from 'react'
import { Gift, Mail } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { trackNewsletterSignup, trackFormSubmit, trackButtonClick } from '../lib/analytics'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    // If Supabase is not configured, show a message and simulate success
    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setMessage('Thank you for subscribing! Check your email for your free product.')
        setStatus('success')
        setEmail('')
        trackNewsletterSignup(true)
        trackFormSubmit('newsletter', true)
      }, 500)
      return
    }

    try {
      // Get admin token - required for newsletter signup
      const adminToken = localStorage.getItem('admin_token')
      
      if (!adminToken) {
        setMessage('Admin authentication required. Please log in as admin first.')
        setStatus('error')
        trackNewsletterSignup(false)
        trackFormSubmit('newsletter', false)
        return
      }
      
      // Use edge function for CORS protection and security
      // Requires admin authentication token to write to database
      const { data, error } = await supabase.functions.invoke('newsletter-signup', {
        body: { 
          email,
          adminToken
        },
      })

      if (error) {
        throw error
      }

      if (data?.error) {
        // Handle specific error cases
        if (data.alreadySubscribed) {
          setMessage('You are already subscribed!')
          setStatus('error')
          trackNewsletterSignup(false)
          trackFormSubmit('newsletter', false)
        } else if (data.error.includes('Unauthorized') || data.error.includes('admin')) {
          setMessage('Admin authentication required. Please log in as admin first.')
          setStatus('error')
          trackNewsletterSignup(false)
          trackFormSubmit('newsletter', false)
        } else if (data.error.includes('Forbidden') || data.error.includes('Origin not allowed')) {
          setMessage('Access denied. Please use the production website.')
          setStatus('error')
          trackNewsletterSignup(false)
          trackFormSubmit('newsletter', false)
        } else {
          throw new Error(data.error)
        }
        return
      }

      if (data?.success) {
        // Successfully subscribed
        if (data.resubscribed) {
          setMessage('Welcome back! You have been resubscribed. Check your email for your free product.')
        } else {
          setMessage('Thank you for subscribing! Check your email for your free product.')
        }
        setStatus('success')
        setEmail('')
        trackNewsletterSignup(true)
        trackFormSubmit('newsletter', true)
      } else {
        throw new Error('Unexpected response from server')
      }
    } catch (error: any) {
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (error?.message?.includes('Forbidden') || error?.message?.includes('Origin not allowed')) {
        errorMessage = 'Access denied. Please use the production website.'
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setMessage(errorMessage)
      setStatus('error')
      trackNewsletterSignup(false)
      trackFormSubmit('newsletter', false)
    }
  }

  return (
    <section className="section-spacing bg-white border-t border-primary-200">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-sm bg-primary-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary-700" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium tracking-wider uppercase text-primary-600">
                Free Product
              </span>
            </div>
            <h2 className="text-display-2 font-display font-bold text-primary-900 mb-6 tracking-tighter text-balance">
              Join Our Email List
            </h2>
            <p className="text-xl text-primary-600 mb-3 font-light leading-relaxed">
              Get a <span className="font-medium text-primary-900">FREE product</span> instantly when you subscribe
            </p>
            <p className="text-lg text-primary-500 font-light">
              Plus receive exclusive tips, updates, and content on organizing your life
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-12 pr-5 py-4 border border-primary-300 rounded-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent transition-all bg-white font-light"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                onClick={() => trackButtonClick('Get Free Product', 'newsletter')}
                className="px-10 py-4 bg-primary-900 text-white font-medium rounded-sm hover:bg-primary-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-soft hover:shadow-luxury tracking-wide uppercase text-sm"
              >
                {status === 'loading' ? 'Subscribing...' : 'Get Free Product'}
              </button>
            </div>
            {message && (
              <div className={`mt-6 p-5 rounded-sm border ${status === 'success' ? 'bg-primary-50 text-primary-800 border-primary-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                <p className="font-medium text-sm">{message}</p>
              </div>
            )}
            <p className="text-xs text-primary-500 text-center font-light tracking-wide">
              No spam. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

