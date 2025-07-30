import { clerkClient } from "@clerk/express";

export const protect = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    // Verify user exists in Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized"
    });
  }
};

export const protectEducator = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized"
      });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    if (clerkUser.publicMetadata?.role !== 'educator') {
      return res.status(403).json({
        success: false,
        message: "Educator access required"
      });
    }

    next();
  } catch (error) {
    console.error("Educator auth error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};