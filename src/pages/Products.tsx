import { ArrowRight } from 'lucide-react'

export default function Products() {
  // Update the 'url' field for each product with your actual Gumroad, Etsy, or Amazon KDP links
  // The entire product card is clickable and will open the link in a new tab
  const products = [
    {
      category: 'E-Books',
      items: [
        {
          title: 'Managing Stress: A Complete Guide',
          description: 'Learn proven techniques to reduce stress and improve your mental well-being.',
          price: '$9.99',
          url: 'https://gumroad.com/l/managing-stress', // Replace with your actual Gumroad URL
          platform: 'Gumroad',
        },
        {
          title: 'Task Management Mastery',
          description: 'Master the art of organizing and prioritizing your tasks for maximum productivity.',
          price: '$12.99',
          url: 'https://gumroad.com/l/task-management', // Replace with your actual Gumroad URL
          platform: 'Gumroad',
        },
        {
          title: 'Productivity Mindset',
          description: 'Transform how you think about productivity and achieve more with less effort.',
          price: '$14.99',
          url: 'https://gumroad.com/l/productivity-mindset', // Replace with your actual Gumroad URL
          platform: 'Gumroad',
        },
        {
          title: 'The Complete Todo System',
          description: 'Build a bulletproof system for managing todos and never miss a deadline again.',
          price: '$11.99',
          url: 'https://gumroad.com/l/todo-system', // Replace with your actual Gumroad URL
          platform: 'Gumroad',
        },
      ],
    },
    {
      category: 'Planners',
      items: [
        {
          title: 'Life Organizer Planner (KDP)',
          description: 'Comprehensive planner for organizing all aspects of your life. Available on Amazon KDP.',
          price: '$19.99',
          url: 'https://www.amazon.com/dp/your-product-id', // Replace with your actual Amazon KDP URL
          platform: 'Amazon',
        },
        {
          title: 'Digital Planner Pack (GoodNotes)',
          description: 'Beautiful digital planners designed for GoodNotes. Perfect for iPad users.',
          price: '$24.99',
          url: 'https://gumroad.com/l/digital-planner', // Replace with your actual Gumroad/Etsy URL
          platform: 'Gumroad',
        },
        {
          title: 'Business Organization Planner',
          description: 'Specialized planner for entrepreneurs and business professionals.',
          price: '$22.99',
          url: 'https://www.etsy.com/listing/your-product-id', // Replace with your actual Etsy URL
          platform: 'Etsy',
        },
        {
          title: 'Home Organization Planner',
          description: 'Everything you need to organize your home, from decluttering to maintenance.',
          price: '$18.99',
          url: 'https://www.etsy.com/listing/your-product-id', // Replace with your actual Etsy URL
          platform: 'Etsy',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-primary-50/30 section-spacing">
      <div className="container-custom">
        <div className="text-center mb-20">
          <h1 className="text-display-2 font-display font-bold text-primary-900 mb-6 tracking-tighter">Our Products</h1>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed">
            Comprehensive guides and planners thoughtfully designed to help you organize every aspect of your life
          </p>
        </div>
        
        {products.map((category) => (
          <div key={category.category} className="mb-24">
            <h2 className="text-4xl font-display font-semibold mb-12 text-primary-900 tracking-tight border-b border-primary-200 pb-6">{category.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {category.items.map((product, index) => (
                <a
                  key={index}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-10 rounded-sm border border-primary-200 hover:border-primary-400 hover:shadow-luxury transition-all duration-500 block cursor-pointer"
                >
                  <h3 className="text-2xl font-display font-semibold mb-5 text-primary-900 tracking-tight group-hover:text-primary-700 transition-colors">{product.title}</h3>
                  <p className="text-primary-600 mb-8 leading-relaxed font-light">{product.description}</p>
                  <div className="flex justify-between items-center pt-6 border-t border-primary-100">
                    <span className="text-2xl font-display font-semibold text-primary-900">{product.price}</span>
                    <div className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white font-medium rounded-sm group-hover:bg-primary-800 transition-all duration-300 text-sm tracking-wide uppercase">
                      View on {product.platform}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

