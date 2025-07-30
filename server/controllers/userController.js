import User from "../models/User.js";
import { clerkClient } from "@clerk/express";
// import stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import Stripe from 'stripe';


// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16' // Using current stable API version
});


export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "User ID not found in request" 
      });
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Check if user exists in your database using clerkId
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      // Try to find by email if clerkId not found
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        dbUser = await User.findOne({ email });
      }

      // If still not found, create new user
      if (!dbUser) {
        dbUser = await User.create({
          clerkId: userId,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          imageUrl: clerkUser.imageUrl,
          enrolledCourses: []
        });
      } else {
        // Update existing user with clerkId if found by email
        dbUser.clerkId = userId;
        await dbUser.save();
      }
    }

    res.json({
      success: true,
      user: {
        ...dbUser.toObject(),
        isEducator: clerkUser.publicMetadata?.role === 'educator'
      }
    });

  } catch (error) {
    console.error("Error in getUserData:", error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      const email = error.keyValue.email;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          success: true,
          user: {
            ...existingUser.toObject(),
            isEducator: false // Default to false if we can't check Clerk metadata
          }
        });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const user = await User.findById(userId)
      .populate({
        path: 'enrolledCourses',
        select: 'courseTitle courseThumbnail educator courseDescription',
        populate: {
          path: 'educator',
          select: 'name'
        }
      })
      .lean();

    res.json({ 
      success: true, 
      enrolledCourses: user?.enrolledCourses || [] 
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch enrolled courses",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In your purchase controller

export const purchaseCourse = async (req, res) => {
  try {
    console.log('Purchase request received:', req.body);
    
    const { courseId } = req.body;
    const userId = req.auth.userId;

    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: "Course ID is required" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    const existingPurchase = await Purchase.findOne({
      userId,
      courseId,
      status: { $in: ['completed', 'pending'] }
    }).lean();

    if (existingPurchase) {
      if (existingPurchase.status === 'pending') {
        const session = await stripe.checkout.sessions.retrieve(
          existingPurchase.sessionId
        );
        return res.json({ 
          success: true, 
          session_url: session.url 
        });
      }
      return res.json({ 
        success: true, 
        isAlreadyEnrolled: true 
      });
    }

    // Create new Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.courseTitle,
            description: `Course by ${course.educator?.name || 'Unknown Educator'}`,
          },
          unit_amount: Math.round(course.coursePrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/courses/${courseId}`,
      metadata: { userId, courseId }
    });

    await Purchase.create({
      userId,
      courseId,
      amount: course.coursePrice,
      status: 'pending',
      sessionId: session.id
    });

    res.json({ 
      success: true, 
      session_url: session.url 
    });

  } catch (error) {
    console.error('FULL PURCHASE ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: "Payment processing failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



export const updateCourseProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    const userId = req.auth.userId;

    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be a number between 0 and 100"
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, "enrolledCourses.courseId": courseId },
      { $set: { "enrolledCourses.$.progress": progress } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Course not found in user's enrollments"
      });
    }

    res.json({ 
      success: true, 
      message: "Progress updated",
      progress
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update progress",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.auth.userId;

    const user = await User.findOne({ 
      _id: userId,
      enrolledCourses: { $elemMatch: { courseId } }
    }).lean();

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found in user's enrollments" 
      });
    }

    const courseProgress = user.enrolledCourses.find(
      course => course.courseId.toString() === courseId
    )?.progress || 0;

    res.json({ 
      success: true, 
      progress: courseProgress 
    });
  } catch (error) {
    console.error("Error getting progress:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch progress",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const addUserRating = async (req, res) => {
  try {
    const { courseId, rating, review } = req.body;
    const userId = req.auth.userId;

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if user is enrolled
    const isEnrolled = await Purchase.exists({
      userId,
      courseId,
      status: "completed"
    });

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false, 
        message: "You must enroll before rating" 
      });
    }

    // Check if user already rated
    const alreadyRated = await Course.exists({
      _id: courseId,
      'ratings.user': userId
    });

    if (alreadyRated) {
      return res.status(400).json({
        success: false,
        message: "You have already rated this course"
      });
    }

    // Add rating to course
    await Course.findByIdAndUpdate(courseId, {
      $push: {
        ratings: {
          user: userId,
          rating,
          review,
          createdAt: new Date()
        }
      },
      $inc: { totalRatings: 1 }
    });

    res.json({ 
      success: true, 
      message: "Rating added successfully" 
    });
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add rating",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};