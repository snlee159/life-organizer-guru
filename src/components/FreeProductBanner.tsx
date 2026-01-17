import { Link } from 'react-router-dom'
import { Gift } from 'lucide-react'

export default function FreeProductBanner() {
  return (
    <div className="bg-primary-900 text-white py-5 border-b border-primary-800">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 text-center md:text-left">
            <Gift className="w-5 h-5 text-gold-400 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-sm md:text-base font-medium tracking-wide uppercase">
              <span className="font-semibold">Join our email list</span> and receive a <span className="font-semibold text-gold-400">FREE product</span> instantly
            </p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-2.5 bg-white text-primary-900 font-medium rounded-sm hover:bg-primary-50 transition-all duration-300 shadow-soft hover:shadow-luxury whitespace-nowrap tracking-wide text-sm uppercase"
          >
            Claim Your Free Product
          </Link>
        </div>
      </div>
    </div>
  )
}

