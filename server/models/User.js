import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      required: [true, 'Name is required'] 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    imageUrl: { 
      type: String, 
      required: [true, 'Image URL is required'] 
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: []
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }, 
  { 
    timestamps: true,
    // This ensures Mongoose won't create an additional _id
    _id: false 
  }
);

// Add index for better query performance
userSchema.index({ _id: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;