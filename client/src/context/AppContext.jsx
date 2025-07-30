/* eslint-disable react/prop-types */
import { createContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch All Courses
  const fetchAllCourses = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendUrl]);

  // Improved User Data Sync
  const syncUserWithBackend = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUserData(null);
        setUserLoading(false);
        return;
      }

      // First try to get existing user data
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        setIsEducator(data.user?.isEducator || false);
        setUserLoading(false);
        return;
      }

      // If no user found, try to sync
      const syncResponse = await axios.post(
        `${backendUrl}/api/user/sync`,
        { clerkUser: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (syncResponse.data.success) {
        setUserData(syncResponse.data.user);
        setIsEducator(syncResponse.data.user?.isEducator || false);
      }
    } catch (error) {
      console.error("User sync error:", error);
      // Handle duplicate key error
      if (error.response?.data?.error?.includes('duplicate')) {
        const existingUser = await axios.get(`${backendUrl}/api/user/data`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (existingUser.data.success) {
          setUserData(existingUser.data.user);
          setIsEducator(existingUser.data.user?.isEducator || false);
        }
      }
    } finally {
      setUserLoading(false);
    }
  }, [backendUrl, getToken, user]);

  // Fetch Enrolled Courses
  const fetchUserEnrolledCourses = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setEnrolledCourses([]);
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setEnrolledCourses(data.enrolledCourses?.reverse() || []);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      setEnrolledCourses([]);
    }
  }, [backendUrl, getToken]);

  // Enrollment Function
  const enrollInCourse = useCallback(async (courseId) => {
    try {
      if (!user) {
        toast.warn("Please login to enroll in this course");
        return false;
      }

      if (userLoading) {
        toast.warn("Please wait while we load your account details...");
        return false;
      }

      const token = await getToken();
      if (!token) {
        toast.error("Authentication failed. Please login again");
        return false;
      }

      // Check if already enrolled
      if (enrolledCourses.some(course => course._id === courseId)) {
        toast.info("You are already enrolled in this course");
        return true;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        if (data.session_url) {
          window.location.href = data.session_url;
          return true;
        }
        if (data.isAlreadyEnrolled) {
          await fetchUserEnrolledCourses();
          toast.info("You are already enrolled in this course");
          return true;
        }
        await fetchUserEnrolledCourses();
        toast.success("Successfully enrolled in course!");
        return true;
      } else {
        toast.error(data.message || "Enrollment failed");
        return false;
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Enrollment failed";
      
      // Handle specific cases
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
        await fetchUserEnrolledCourses();
        toast.info("You are already enrolled in this course");
        return true;
      }
      
      toast.error(errorMsg);
      return false;
    }
  }, [backendUrl, getToken, user, enrolledCourses, fetchUserEnrolledCourses, userLoading]);

  // Helper Functions (keep your existing ones)
  const calculateRating = useCallback((course) => {
    if (!course?.courseRatings?.length) return 0;
    const total = course.courseRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / course.courseRatings.length;
  }, []);

  const calculateChapterTime = useCallback((chapter) => {
    let time = 0;
    if (Array.isArray(chapter?.chapterContent)) {
      chapter.chapterContent.forEach((lecture) => {
        time += lecture.lectureDuration || 0;
      });
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"], round: true });
  }, []);

  const calculateCourseDuration = useCallback((course) => {
    let time = 0;
    course?.courseContent?.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        chapter.chapterContent.forEach((lecture) => {
          time += lecture.lectureDuration || 0;
        });
      }
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"], round: true });
  }, []);

  const calculateNoOfLectures = useCallback((course) => {
    let totalLectures = 0;
    course?.courseContent?.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    return totalLectures;
  }, []);

  // Initial Load
  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  // User Change Effect
  useEffect(() => {
    if (isLoaded) {
      setUserLoading(true);
      if (user) {
        Promise.all([syncUserWithBackend(), fetchUserEnrolledCourses()])
          .then(() => setAuthChecked(true))
          .catch(() => setAuthChecked(true))
          .finally(() => setUserLoading(false));
      } else {
        setUserData(null);
        setEnrolledCourses([]);
        setAuthChecked(true);
        setUserLoading(false);
      }
    }
  }, [user, isLoaded, syncUserWithBackend, fetchUserEnrolledCourses]);

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
    userData,
    setUserData,
    getToken,
    enrollInCourse,
    authChecked,
    userLoading
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};