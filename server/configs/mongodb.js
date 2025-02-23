import mongoose from 'mongoose';

// Connect to the MongoDB database
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/lms`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Database Connected');
    } catch (error) {
        console.error('Database connection error:', error);
    }
};

export default connectDB;