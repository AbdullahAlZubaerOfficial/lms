import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import fs from 'fs';

// Update role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // First check if user is already an educator
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata?.role === 'educator') {
      return res.json({ 
        success: true, 
        isEducator: true,
        message: "User is already an educator" 
      });
    }

    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    res.json({ 
      success: true, 
      isEducator: true,
      message: "You can publish courses now" 
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Check educator role
export const checkEducatorRole = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await clerkClient.users.getUser(userId);
    
    const isEducator = user.publicMetadata?.role === 'educator';
    
    res.json({ 
      success: true, 
      isEducator 
    });
  } catch (error) {
    console.error("Error checking educator role:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Add New Course
export const addCourse = async (req, res) => {
  try {
    // Validate image exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Course thumbnail is required" 
      });
    }

    // Parse and validate course data
    let parsedCourseData;
    try {
      parsedCourseData = JSON.parse(req.body.courseData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid course data format"
      });
    }

    // Validate required fields
    const requiredFields = ['courseTitle', 'courseDescription', 'coursePrice', 'discount', 'courseContent'];
    for (const field of requiredFields) {
      if (!parsedCourseData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // Validate course content structure
    if (!Array.isArray(parsedCourseData.courseContent) || parsedCourseData.courseContent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course must have at least one chapter"
      });
    }

    // Validate each chapter has content and required fields
    for (const [chapterIndex, chapter] of parsedCourseData.courseContent.entries()) {
      if (!chapter.chapterContent || chapter.chapterContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Chapter "${chapter.chapterTitle || chapterIndex + 1}" must have at least one lecture`
        });
      }

      // Validate each lecture has required fields
      for (const [lectureIndex, lecture] of chapter.chapterContent.entries()) {
        const requiredLectureFields = ['lectureTitle', 'lectureDuration', 'lectureUrl', 'lectureOrder'];
        for (const field of requiredLectureFields) {
          if (lecture[field] === undefined || lecture[field] === null) {
            return res.status(400).json({
              success: false,
              message: `Lecture ${lectureIndex + 1} in chapter "${chapter.chapterTitle || chapterIndex + 1}" is missing required field: ${field}`
            });
          }
        }
      }
    }

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(req.file.path, {
      folder: 'course-thumbnails',
      quality: 'auto:good'
    });

    // Create course
    const newCourse = await Course.create({
      ...parsedCourseData,
      educator: req.auth.userId,
      courseThumbnail: {
        url: imageUpload.secure_url,
        publicId: imageUpload.public_id
      }
    });

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({ 
      success: true, 
      message: "Course created successfully",
      courseId: newCourse._id 
    });

  } catch (error) {
    console.error("Error adding course:", error);
    
    // Clean up uploaded file if error occurred
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const courses = await Course.find({ educator: educatorId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({ 
      success: true, 
      courses,
      count: courses.length 
    });
  } catch (error) {
    console.error("Error fetching educator courses:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Educator Dashboard Data
export const educatorDashboardData = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    
    // Get all courses with enrolled students count
    const courses = await Course.find({ educator: educatorId })
      .select('courseTitle enrolledStudents');
    
    const totalCourses = courses.length;
    const totalStudents = courses.reduce(
      (sum, course) => sum + course.enrolledStudents.length, 0
    );

    // Get all completed purchases
    const courseIds = courses.map(course => course._id);
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed"
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount, 0
    );

    // Get recent enrolled students (last 5)
    const recentStudents = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed"
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name imageUrl')
      .populate('courseId', 'courseTitle');

    res.json({
      success: true,
      dashboardData: {
        totalCourses,
        totalStudents,
        totalEarnings,
        recentEnrollments: recentStudents.map(purchase => ({
          student: purchase.userId,
          courseTitle: purchase.courseId.courseTitle,
          enrolledDate: purchase.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get Enrolled Students
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    
    // Get all courses by this educator
    const courses = await Course.find({ educator: educatorId })
      .select('_id courseTitle');
    
    const courseIds = courses.map(course => course._id);

    // Get all purchases with student and course details
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed"
    })
      .populate('userId', 'name email imageUrl')
      .populate('courseId', 'courseTitle')
      .sort({ createdAt: -1 });

    // Format the response
    const enrolledStudents = purchases.map(purchase => ({
      student: {
        _id: purchase.userId._id,
        name: purchase.userId.name,
        email: purchase.userId.email,
        imageUrl: purchase.userId.imageUrl
      },
      courseId: purchase.courseId._id,
      courseTitle: purchase.courseId.courseTitle,
      enrolledDate: purchase.createdAt,
      purchaseId: purchase._id
    }));

    res.json({ 
      success: true, 
      enrolledStudents,
      count: enrolledStudents.length 
    });
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};