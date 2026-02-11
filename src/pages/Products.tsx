import { ArrowRight } from "lucide-react";

export default function Products() {
  // Update the 'url' field for each product with your actual Gumroad, Etsy, or Amazon KDP links
  // The entire product card is clickable and will open the link in a new tab
  const products = [
    {
      category: "Apps & Tools",
      items: [
        {
          title: "Runtime Product Manager",
          description:
            "An automated product manager for your life, built to help you break down and scope tasks and prioritize with automated daily task assignment based on your goals, energy, and time.",
          price: "Free Tier Available",
          url: "https://runtimepm.com",
          platform: "Website",
          image: "/images/runtime-pm-display.jpeg",
        },
      ],
    },
    {
      category: "Books",
      items: [
        {
          title:
            "Default to Less: How to Reduce Cognitive Load and Build a Life With Direction",
          description:
            "A calm, practical guide for high-functioning people who feel overwhelmed, showing how to reduce cognitive load by letting go first and rebuilding only what truly matters.",
          price: "Starting at $7.99", // $17.99 for paperback, $26.99 for hardcover
          url: "https://www.amazon.com/dp/B0GJF2CCS7",
          platform: "Amazon",
          image: "/images/default-to-less.png",
        },
      ],
    },
    {
      category: "Planners & Notion Templates",
      items: [
        {
          title: "The LOG Book",
          description:
            "Annual planner built to help you focus on what matters and finish what you start.",
          price: "Starting at $20.99", // $29.99 for hardcover
          url: "https://www.amazon.com/dp/B0GHDSCSZ2",
          platform: "Amazon",
          image: "/images/log_book_display.jpeg",
        },
        {
          title: "Daily Focus Planner Notepad",
          description:
            "This tearaway daily planner notepad helps you focus on what actually matters — without overwhelm, clutter, or endless task lists.",
          price: "$16.99",
          url: "https://www.etsy.com/listing/4455909723/daily-focus-planner-notepad-minimalist",
          platform: "Etsy",
          image: "/images/daily-focus-planner-notepad.png",
        },
        {
          title: "Reading List Template for Notion",
          description:
            "A template for Notion to help you track your reading list and progress.",
          price: "Free for a limited time",
          url: "https://www.notion.so/marketplace/templates/virtual-bookcase-smart-reading-list",
          platform: "Notion",
          image: "/images/reading-list-template.png",
        },
        {
          title: "Easy Peasy Debt Tracker Template for Notion",
          description:
            "A template for Notion to help you track your debt and progress.",
          price: "$5.00",
          url: "https://www.notion.so/marketplace/templates/easy-peasy-debt-tracker",
          platform: "Notion",
          image: "/images/debt-tracker-template.png",
        },
        {
          title: "Task & Sprint Tracking Template for Notion",
          description:
            "A template for Notion to help you track your tasks and sprints.",
          price: "Free for a limited time",
          url: "https://www.notion.so/marketplace/templates/task-sprint-tracking",
          platform: "Notion",
          image: "/images/task-sprint-template.png",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-primary-50/30 section-spacing">
      <div className="container-custom">
        <div className="text-center mb-20">
          <h1 className="text-display-2 font-display font-bold text-primary-900 mb-6 tracking-tighter">
            Our Products
          </h1>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed">
            Comprehensive guides and planners thoughtfully designed to help you
            organize every aspect of your life
          </p>
        </div>

        {products.map((category) => (
          <div key={category.category} className="mb-24">
            <h2 className="text-4xl font-display font-semibold mb-12 text-primary-900 tracking-tight border-b border-primary-200 pb-6">
              {category.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {category.items.map((product, index) => (
                <a
                  key={index}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-sm border border-primary-200 hover:border-primary-400 hover:shadow-luxury transition-all duration-500 block cursor-pointer overflow-hidden"
                >
                  <div className="aspect-video w-full bg-primary-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.style.background =
                          "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)";
                      }}
                    />
                  </div>
                  <div className="p-10">
                    <h3 className="text-2xl font-display font-semibold mb-5 text-primary-900 tracking-tight group-hover:text-primary-700 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-primary-600 mb-8 leading-relaxed font-light">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center pt-6 border-t border-primary-100">
                      <span className="text-2xl font-display font-semibold text-primary-900">
                        {product.price}
                      </span>
                      <div className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white font-medium rounded-sm group-hover:bg-primary-800 transition-all duration-300 text-sm tracking-wide uppercase">
                        View on {product.platform}
                        <ArrowRight
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
