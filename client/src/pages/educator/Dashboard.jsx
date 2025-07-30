/* eslint-disable no-undef */ 
import { useContext, useEffect, useState } from "react"; 
import { AppContext } from "../../context/AppContext"; 
import { assets, dummyDashboardData } from "../../assets/assets"; 
import Loading from "../../components/student/Loading"; 

const Dashboard = () => { 
  const { currency } = useContext(AppContext); 
  const [dashboardData, setDashboardData] = useState(null); 

  const fetchDashboardData = async () => { 
    setDashboardData(dummyDashboardData); 
  }; 

  useEffect(() => { 
    fetchDashboardData(); 
  }, []); 

  return dashboardData ? ( 
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <img src={assets.patients_icon} alt="enrollments" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Enrolments</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {dashboardData.enrolledStudentsData.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <img src={assets.appointments_icon} alt="courses" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {dashboardData.totalCourses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <img src={assets.earning_icon} alt="earnings" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {currency}{dashboardData.totalEarnings}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Enrolments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Latest Enrolments</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.student?.imageUrl && (
                          <img
                            src={item.student.imageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.student?.name || "No Name"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.student?.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900 font-medium">{item.courseTitle}</p>
                      <p className="text-xs text-gray-500">{item.courseCategory || "General"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {new Date().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Dashboard;