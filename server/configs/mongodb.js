import mongoose from 'mongoose';

// Connect to the MongoDB database
const connectDB = async () => {
    mongoose.connection.on('connected',()=>console.log('Database Connected'))
    mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
    await mongoose.connect(`${process.env.MONGODB_URI}`)
    
};

export default connectDB;