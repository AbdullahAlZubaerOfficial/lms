import { useContext } from "react";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext"; 
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);
  
  // Calculate discounted price
  const discountedPrice = (course.coursePrice - (course.discount * course.coursePrice / 100)).toFixed(2);
  
  // Handle image error
  const handleImageError = (e) => {
    e.target.src = assets.default_course_image;
    e.target.onerror = null; // Prevent infinite loop if default image fails
  };

  return (
    <Link 
      to={`/course/${course._id}`} 
      onClick={() => window.scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300"
      aria-label={`View ${course.courseTitle} course details`}
    >
      <div className="aspect-video overflow-hidden">
        <img 
          className="w-full h-full object-cover" 
          src={course.courseThumbnail?.url || assets.default_course_image} 
          alt={course.courseTitle}
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      
      <div className="p-3 text-left space-y-2">
        <h3 className="text-base font-semibold line-clamp-2" title={course.courseTitle}>
          {course.courseTitle}
        </h3>
        
        <p className="text-gray-600 text-sm">
          {course.educator?.name || "Unknown Educator"}
        </p>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {calculateRating(course).toFixed(1)}
          </span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img 
                key={i} 
                src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank} 
                alt={i < calculateRating(course) ? "Filled star" : "Empty star"}
                className="w-3.5 h-3.5"
              />
            ))}
          </div>
          <span className="text-gray-500 text-sm">
            ({course.courseRatings?.length || 0})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-gray-800">
            {currency}{discountedPrice}
          </p>
          {course.discount > 0 && (
            <p className="text-sm text-gray-500 line-through">
              {currency}{course.coursePrice}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    courseTitle: PropTypes.string.isRequired,
    courseThumbnail: PropTypes.shape({
      url: PropTypes.string
    }),
    educator: PropTypes.shape({
      name: PropTypes.string
    }),
    coursePrice: PropTypes.number.isRequired,
    discount: PropTypes.number.isRequired,
    courseRatings: PropTypes.arrayOf(PropTypes.shape({
      // Define your rating shape here if needed
    })).isRequired
  }).isRequired
};

export default CourseCard;