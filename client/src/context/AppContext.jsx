/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

// Create Context
export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // ✅ Fetch All Courses
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/course/all");
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Fetch User Data
  const fetchUserData = async () => {
    if (user?.publicMetadata?.role === "educator") {
      setIsEducator(true);
    }

    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

// Add to AppContext.jsx
const enrollInCourse = async (courseId) => {
  try {
    const token = await getToken();
    const { data } = await axios.post(
      `${backendUrl}/api/user/enroll`,
      { courseId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.success) {
      fetchUserEnrolledCourses(); // Refresh enrolled courses
      toast.success("Successfully enrolled in course!");
      return true;
    } else {
      toast.error(data.message);
      return false;
    }
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

// Add enrollInCourse to the context value


  // ✅ Fetch Enrolled Courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/user/enrolled-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Average Rating
  const calculateRating = (course) => {
    if (!course.courseRatings || course.courseRatings.length === 0) return 0;

    const total = course.courseRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.floor(total / course.courseRatings.length);
  };

  // ✅ Chapter Time
  const calculateChapterTime = (chapter) => {
    let time = 0;
    if (Array.isArray(chapter.chapterContent)) {
      chapter.chapterContent.forEach((lecture) => {
        time += lecture.lectureDuration;
      });
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // ✅ Total Course Duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent?.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        chapter.chapterContent.forEach((lecture) => {
          time += lecture.lectureDuration;
        });
      }
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // ✅ Total No. of Lectures
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent?.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    return totalLectures;
  };

  // 🧠 Load on Mount
  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  // ✅ Context Value
  const value = {
    currency,
    allCourses,
    navigate,
    isEducator,
    setIsEducator,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    enrolledCourses,
    setEnrolledCourses,
    fetchAllCourses,
    setAllCourses,
    backendUrl,
    user,
    setUserData,
    getToken,
    enrollInCourse
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
