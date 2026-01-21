import { Link } from 'react-router-dom'
import { Linkedin, Twitter, Instagram, Mail, BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white border-t border-primary-800">
      <div className="container-custom py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-display font-semibold mb-6 tracking-tight">Life Organizer Guru</h3>
            <p className="text-primary-300 leading-relaxed font-light text-sm">
              Helping you organize your life, business, love, and home.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-6 text-xs tracking-wider uppercase text-primary-400">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-primary-300 hover:text-white transition-colors text-sm font-light">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-primary-300 hover:text-white transition-colors text-sm font-light">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-primary-300 hover:text-white transition-colors text-sm font-light">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-300 hover:text-white transition-colors text-sm font-light">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-6 text-xs tracking-wider uppercase text-primary-400">Connect</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://www.linkedin.com/company/life-organizer-guru" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
                  <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://threads.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  Threads
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://medium.com/@life-organizer-guru" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  Medium
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-6 text-xs tracking-wider uppercase text-primary-400">Contact</h4>
            <a href="mailto:contact@lifeorganizerguru.com" className="flex items-center gap-2 text-primary-300 hover:text-white transition-colors text-sm font-light group">
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              contact@lifeorganizerguru.com
            </a>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-primary-800 text-center">
          <p className="text-primary-400 text-xs font-light tracking-wide">&copy; {new Date().getFullYear()} Life Organizer Guru. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

