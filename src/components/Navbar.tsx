import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-primary-200 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-24">
          <Link to="/" className="text-2xl font-display font-semibold text-primary-900 tracking-tighter hover:text-primary-700 transition-colors duration-300">
            Life Organizer Guru
          </Link>
          <div className="hidden md:flex items-center space-x-12">
            <Link to="/" className="text-primary-700 hover:text-primary-900 transition-colors text-sm font-medium tracking-wide uppercase text-xs">
              Home
            </Link>
            <Link to="/products" className="text-primary-700 hover:text-primary-900 transition-colors text-sm font-medium tracking-wide uppercase text-xs">
              Products
            </Link>
            <Link to="/services" className="text-primary-700 hover:text-primary-900 transition-colors text-sm font-medium tracking-wide uppercase text-xs">
              Services
            </Link>
            <Link to="/contact" className="text-primary-700 hover:text-primary-900 transition-colors text-sm font-medium tracking-wide uppercase text-xs">
              Contact
            </Link>
          </div>
          <div className="md:hidden">
            <button className="text-primary-700 p-2 hover:text-primary-900 transition-colors">
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

