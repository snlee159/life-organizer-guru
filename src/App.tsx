import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FreeProductBanner from './components/FreeProductBanner'
import Home from './pages/Home'
import Products from './pages/Products'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import Unsubscribe from './pages/Unsubscribe'

function App() {
  return (
    <Router>
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
