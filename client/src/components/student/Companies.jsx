import { assets } from "../../assets/assets";
import "./Companies.css";

const Companies = () => {
  // Original companies array (no duplicates needed - we'll handle looping in CSS)
  const companies = [
    { logo: assets.microsoft_logo, alt: "Microsoft" },
    { logo: assets.walmart_logo, alt: "Walmart" },
    { logo: assets.accenture_logo, alt: "Accenture" },
    { logo: assets.adobe_logo, alt: "Adobe" },
    { logo: assets.paypal_logo, alt: "Paypal" },
  ];

  return (
    <div className="companies-section py-12 md:py-16 lg:py-20 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-2">
            Trusted by learners from
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Leading Companies Worldwide
          </h2>
        </div>
        
        {/* First row (left to right) */}
        <div className="company-slider mb-6 md:mb-8 lg:mb-10">
          <div className="company-track">
            {[...companies, ...companies].map((company, index) => (
              <div 
                key={`first-${index}`} 
                className="company-slide px-4 sm:px-6 py-3 sm:py-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={company.logo} 
                  alt={company.alt} 
                  className="h-8 sm:h-10 md:h-12 object-contain w-auto max-w-[100px] sm:max-w-[120px]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Second row (right to left) - slightly delayed */}
        <div className="company-slider-reverse">
          <div className="company-track">
            {[...companies, ...companies].map((company, index) => (
              <div 
                key={`second-${index}`} 
                className="company-slide px-4 sm:px-6 py-3 sm:py-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={company.logo} 
                  alt={company.alt} 
                  className="h-8 sm:h-10 md:h-12 object-contain w-auto max-w-[100px] sm:max-w-[120px]"
                  loading="lazy"
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