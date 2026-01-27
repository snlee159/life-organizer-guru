import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as api from '../services/api-secure'
import NewsletterSignup from '../components/NewsletterSignup'
import { trackFormSubmit, trackButtonClick } from '../lib/analytics'

export default function Contact() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchParams] = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const serviceMessages: Record<string, string> = {
    'interior-organization': `Hi! I'm interested in learning more about your Interior Organization Consulting service.

I'd love to discuss how you can help me transform my living and working spaces into organized, functional environments. Please let me know about availability and next steps.

Thank you!`,
    'mindset-coaching': `Hi! I'm interested in your Mindset Coaching service.

I'd like to develop a productivity mindset and overcome mental barriers to organization. Please let me know about availability and how we can get started.

Thank you!`,
    'life-organization': `Hi! I'm interested in your Life Organization Consulting service.

I'd love to get comprehensive consulting for organizing all aspects of my life. Please let me know about availability and next steps.

Thank you!`,
    'business-organization': `Hi! I'm interested in your Business Organization service.

I'd like to help my business run more efficiently with better systems, processes, and organization strategies. Please let me know about availability and how we can get started.

Thank you!`,
  }

  useEffect(() => {
    const serviceId = searchParams.get('service')
    if (serviceId && serviceMessages[serviceId]) {
      // Scroll to form after a short delay to ensure page is loaded
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Pre-fill the message field
        if (messageRef.current) {
          messageRef.current.value = serviceMessages[serviceId]
        }
      }, 100)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('submitting')
    setErrorMessage('')
    trackButtonClick('Send Message', 'contact')
    
    const form = e.currentTarget
    const formData = {
      name: (form.querySelector('#name') as HTMLInputElement).value,
      email: (form.querySelector('#email') as HTMLInputElement).value,
      message: (form.querySelector('#message') as HTMLTextAreaElement).value,
    }

    try {
      const result = await api.submitContactForm(formData)
      
      if (result.success) {
        setFormStatus('success')
        trackFormSubmit('contact', true)
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormStatus('idle')
          form.reset()
        }, 3000)
      } else {
        throw new Error(result.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      const message = error instanceof Error ? error.message : 'Failed to send message'
      setErrorMessage(message)
      setFormStatus('error')
      trackFormSubmit('contact', false)
      // Reset error state after 5 seconds
      setTimeout(() => {
        setFormStatus('idle')
        setErrorMessage('')
      }, 5000)
    }
  }
  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tighter">Get In Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? Want to book a consultation? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-8 md:p-12 rounded-lg mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-gray-900 tracking-tight">Contact Information</h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-tight">Email</h3>
              <a
                href="mailto:contact@lifeorganizerguru.com"
                className="text-gray-700 hover:text-gray-900 transition-colors text-lg"
              >
                contact@lifeorganizerguru.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-tight">Follow Us</h3>
              <div className="flex flex-wrap gap-6">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://threads.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Threads
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://medium.com/@yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Medium
                </a>
              </div>
            </div>
          </div>
        </div>

        <div ref={formRef} className="bg-white border border-gray-200 p-8 md:p-12 rounded-lg mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-900 tracking-tight">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2 tracking-tight">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-5 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2 tracking-tight">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-5 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2 tracking-tight">
                Message
              </label>
              <textarea
                ref={messageRef}
                id="message"
                rows={6}
                className="w-full px-5 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={formStatus === 'submitting'}
              className="w-full px-6 py-4 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formStatus === 'submitting' ? 'Sending...' : formStatus === 'success' ? 'Message Sent!' : 'Send Message'}
            </button>
            {formStatus === 'success' && (
              <p className="text-green-600 text-sm text-center">Thank you! Your message has been sent. We'll get back to you soon.</p>
            )}
            {formStatus === 'error' && (
              <p className="text-red-600 text-sm text-center">
                {errorMessage || 'Sorry, there was an error sending your message. Please try again or email us directly.'}
              </p>
            )}
          </form>
        </div>

        <NewsletterSignup />
      </div>
    </div>
  )
}

