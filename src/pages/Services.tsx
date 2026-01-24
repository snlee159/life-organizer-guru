import { Link } from 'react-router-dom'

export default function Services() {
  const services = [
    {
      id: 'interior-organization',
      title: 'Interior Organization Consulting',
      description: 'Transform your living and working spaces into organized, functional environments. I\'ll help you declutter, optimize storage, and create systems that work for your lifestyle.',
      features: [
        'Virtual consultations',
        'Custom organization solutions',
        'Decluttering strategies',
        'Space optimization',
      ],
      price: 'Starting at $150/hour',
    },
    {
      id: 'mindset-coaching',
      title: 'Mindset Coaching',
      description: 'Develop a productivity mindset and overcome mental barriers to organization. Learn to think differently about tasks, priorities, and time management.',
      features: [
        'One-on-one coaching sessions',
        'Personalized action plans',
        'Accountability support',
        'Mindset transformation techniques',
      ],
      price: 'Starting at $120/hour',
    },
    {
      id: 'life-organization',
      title: 'Life Organization Consulting',
      description: 'Comprehensive consulting for organizing all aspects of your life: personal tasks, business operations, relationships, and home management.',
      features: [
        'Holistic life assessment',
        'Custom organization systems',
        'Productivity optimization',
        'Ongoing support',
      ],
      price: 'Starting at $200/hour',
    },
    {
      id: 'business-organization',
      title: 'Business Organization',
      description: 'Help your business run more efficiently with better systems, processes, and organization strategies.',
      features: [
        'Process optimization',
        'Team organization strategies',
        'Workflow improvements',
        'Business system design',
      ],
      price: 'Starting at $250/hour',
    },
  ]

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tighter">Our Services</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Personalized consulting services to help you organize every aspect of your life. 
            Book a consultation to get started on your journey to a more organized, stress-free life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">{service.title}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
              <ul className="space-y-3 mb-8">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-gray-900 mr-3 font-bold">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <span className="text-xl font-bold text-gray-900">{service.price}</span>
                <Link
                  to={`/contact?service=${service.id}`}
                  className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Request
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 p-12 rounded-lg text-center">
          <h3 className="text-3xl font-semibold mb-4 text-gray-900 tracking-tight">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-8 text-lg">
            Contact us to schedule a consultation or learn more about our services.
          </p>
          <a
            href="mailto:contact@lifeorganizerguru.com"
            className="inline-block px-8 py-4 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}

