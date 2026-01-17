import { Link } from 'react-router-dom'
import { BookOpen, Briefcase, Target } from 'lucide-react'
import NewsletterSignup from '../components/NewsletterSignup'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative section-spacing overflow-hidden">
        {/* Fallback background color - behind everything */}
        <div className="absolute inset-0 bg-primary-50 z-0"></div>
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/60 via-primary-900/40 to-primary-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-transparent"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-white bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                Curated Organization Solutions
              </span>
            </div>
            <h1 className="text-display-1 md:text-[5.5rem] lg:text-[6.5rem] font-display font-bold text-white mb-8 tracking-tighter text-balance leading-[1.05] mx-auto drop-shadow-lg">
              Life Organizer Guru
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed font-light text-balance drop-shadow-md">
              Transform your life through intentional organization. Master productivity, reduce stress, and create harmony across life, business, relationships, and home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/products"
                className="group px-10 py-4 bg-white text-primary-900 font-medium rounded-sm hover:bg-primary-50 transition-all duration-300 shadow-luxury hover:shadow-xl tracking-wide"
              >
                Explore Products
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/services"
                className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-sm border border-white/30 hover:bg-white/20 transition-all duration-300 tracking-wide"
              >
                Book Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-primary-50/30 border-t border-primary-200">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="text-display-2 font-display font-bold text-primary-900 mb-6 tracking-tighter">
              What We Offer
            </h2>
            <p className="text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed">
              Comprehensive solutions thoughtfully designed for organizing every aspect of your life
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="group bg-white p-10 rounded-sm border border-primary-200 hover:border-primary-400 transition-all duration-500 hover:shadow-luxury">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-sm bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                  <BookOpen className="w-7 h-7 text-primary-700" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4 text-primary-900 tracking-tight">E-Books & Planners</h3>
              <p className="text-primary-600 leading-relaxed font-light">
                Comprehensive guides on stress management, task organization, productivity mindset, and more.
              </p>
            </div>
            <div className="group bg-white p-10 rounded-sm border border-primary-200 hover:border-primary-400 transition-all duration-500 hover:shadow-luxury">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-sm bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                  <Briefcase className="w-7 h-7 text-primary-700" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4 text-primary-900 tracking-tight">Consulting Services</h3>
              <p className="text-primary-600 leading-relaxed font-light">
                Personalized consulting for interior organization, mindset coaching, and life optimization.
              </p>
            </div>
            <div className="group bg-white p-10 rounded-sm border border-primary-200 hover:border-primary-400 transition-all duration-500 hover:shadow-luxury">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-sm bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-300">
                  <Target className="w-7 h-7 text-primary-700" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-2xl font-display font-semibold mb-4 text-primary-900 tracking-tight">Holistic Approach</h3>
              <p className="text-primary-600 leading-relaxed font-light">
                Organization solutions for every aspect of your life: personal, professional, relationships, and home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />
    </div>
  )
}

