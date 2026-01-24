import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FreeProductBanner from './components/FreeProductBanner'
import Home from './pages/Home'
import Products from './pages/Products'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import Unsubscribe from './pages/Unsubscribe'
import { trackPageView, trackClick } from './lib/analytics'

// Component to scroll to top on route changes
function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  return null
}

// Component to track page views on route changes
function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title)
  }, [location])

  return null
}

// Component to track all clicks globally
function ClickTracker() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Track link clicks
      const link = target.closest('a')
      if (link) {
        const href = link.getAttribute('href')
        const text = link.textContent?.trim() || ''
        if (href && !href.startsWith('#')) {
          trackClick('link', `${text || href}`)
        }
      }
      
      // Track button clicks
      const button = target.closest('button')
      if (button && !link) {
        const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || 'button'
        trackClick('button', buttonText)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return null
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <PageViewTracker />
      <ClickTracker />
      <div className="min-h-screen flex flex-col bg-white">
        <FreeProductBanner />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
