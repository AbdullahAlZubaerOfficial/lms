import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";

const MyCourses = () => {
  const { currency, allCourses, backendUrl } = useContext(AppContext);
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducatorCourses = async () => {
      try {
        // Filter only courses that exist and have required properties
        const validCourses = (allCourses || []).filter(course => 
          course && 
          course._id && 
          course.courseTitle && 
          Array.isArray(course.enrolledStudents)
        );
        
        setCourses(validCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorCourses();
  }, [allCourses]);

  const getCourseThumbnail = (thumbnail) => {
    if (!thumbnail) return '/default-course-image.png';
    return thumbnail.startsWith('http') ? thumbnail : `${backendUrl}/uploads/${thumbnail}`;
  };

  const calculateEarnings = (course) => {
    if (!course || !course.enrolledStudents || !course.coursePrice) return 0;
    const discount = course.discount || 0;
    const priceAfterDiscount = course.coursePrice - (course.coursePrice * discount) / 100;
    return (course.enrolledStudents.length * priceAfterDiscount).toFixed(2);
  };

  if (loading) return <Loading />;

  return (
    <div className="h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">My Courses</h2>
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          {courses?.length > 0 ? (
            <table className="md:table-auto table-fixed w-full overflow-hidden">
              <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                  <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                  <th className="px-4 py-3 font-semibold truncate">Students</th>
                  <th className="px-4 py-3 font-semibold truncate">Published On</th>
                </tr>
              </thead>

              <tbody className="text-sm text-gray-500">
                {courses.map((course) => (
                  <tr key={course._id} className="border-b border-gray-500/20 hover:bg-gray-50">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <img 
                        src={getCourseThumbnail(course.courseThumbnail)} 
                        alt="Course" 
                        className="w-16 h-10 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/default-course-image.png';
                          e.target.onerror = null;
                        }}
                      />
                      <span className="truncate hidden md:block">{course.courseTitle}</span>
                    </td>
                    <td className="px-4 py-3">
                      {currency} {calculateEarnings(course)}
                    </td>
                    <td className="px-4 py-3">
                      {course.enrolledStudents?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No courses found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCourses;