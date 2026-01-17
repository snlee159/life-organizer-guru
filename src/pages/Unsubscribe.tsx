import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const email = searchParams.get('email')

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setStatus('error')
        setMessage('Invalid unsubscribe link')
        return
      }

      // If Supabase is not configured, show success message anyway
      if (!isSupabaseConfigured()) {
        setStatus('success')
        setMessage('You have been successfully unsubscribed from our newsletter.')
        console.log('Unsubscribe (Supabase not configured):', email)
        return
      }

      try {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ subscribed: false })
          .eq('email', email)

        if (error) {
          throw error
        }

        setStatus('success')
        setMessage('You have been successfully unsubscribed from our newsletter.')
      } catch (error) {
        console.error('Unsubscribe error:', error)
        setStatus('error')
        setMessage('An error occurred. Please contact us directly.')
      }
    }

    unsubscribe()
  }, [email])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p>Processing your unsubscribe request...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-4 text-green-600">Unsubscribed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              We're sorry to see you go. You can always resubscribe anytime!
            </p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="text-4xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <a
              href="mailto:contact@lifeorganizerguru.com"
              className="text-primary-600 hover:text-primary-700"
            >
              Contact us for assistance
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

