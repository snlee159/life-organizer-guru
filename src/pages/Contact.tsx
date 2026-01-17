import { useState } from 'react'
import NewsletterSignup from '../components/NewsletterSignup'
import { trackFormSubmit, trackButtonClick } from '../lib/analytics'

export default function Contact() {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('submitting')
    trackButtonClick('Send Message', 'contact')
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      setFormStatus('success')
      trackFormSubmit('contact', true)
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormStatus('idle')
        e.currentTarget.reset()
      }, 3000)
    }, 1000)
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

        <div className="bg-white border border-gray-200 p-8 md:p-12 rounded-lg mb-16">
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
              <p className="text-green-600 text-sm text-center">Thank you! Your message has been sent.</p>
            )}
          </form>
        </div>

        <NewsletterSignup />
      </div>
    </div>
  )
}

