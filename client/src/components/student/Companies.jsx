import { assets } from "../../assets/assets";
import "./Companies.css"; // We'll create this for the animation

const Companies = () => {
  const companies = [
    { logo: assets.microsoft_logo, alt: "Microsoft" },
    { logo: assets.walmart_logo, alt: "Walmart" },
    { logo: assets.accenture_logo, alt: "Accenture" },
    { logo: assets.adobe_logo, alt: "Adobe" },
    { logo: assets.paypal_logo, alt: "Paypal" },
    // Duplicate them for seamless looping
    { logo: assets.microsoft_logo, alt: "Microsoft" },
    { logo: assets.walmart_logo, alt: "Walmart" },
    { logo: assets.accenture_logo, alt: "Accenture" },
    { logo: assets.adobe_logo, alt: "Adobe" },
    { logo: assets.paypal_logo, alt: "Paypal" },
  ];

  return (
    <div className="companies-section py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-gray-500 text-lg mb-2">
          Trusted by learners from
        </p>
        <h2 className="text-center text-3xl font-bold text-gray-800 mb-12">
          Leading Companies Worldwide
        </h2>
        
        {/* First row (left to right) */}
        <div className="company-slider mb-8">
          <div className="company-track">
            {companies.map((company, index) => (
              <div 
                key={`first-${index}`} 
                className="company-slide px-6 py-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={company.logo} 
                  alt={company.alt} 
                  className="h-12 object-contain w-auto max-w-[120px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Second row (right to left) */}
        <div className="company-slider-reverse">
          <div className="company-track">
            {companies.map((company, index) => (
              <div 
                key={`second-${index}`} 
                className="company-slide px-6 py-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={company.logo} 
                  alt={company.alt} 
                  className="h-12 object-contain w-auto max-w-[120px]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Companies;