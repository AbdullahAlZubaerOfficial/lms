import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required'],
        validate: {
            validator: async function(value) {
                if (!mongoose.Types.ObjectId.isValid(value)) return false;
                const course = await mongoose.model('Course').findById(value).select('_id');
                return !!course;
            },
            message: 'Invalid Course ID: Course not found'
        },
        index: true
    },
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        validate: {
            validator: async function(value) {
                const user = await mongoose.model('User').findOne({ _id: value }).select('_id');
                return !!user;
            },
            message: 'Invalid User ID: User not found'
        },
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
        set: v => parseFloat(v.toFixed(2))
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'canceled'],
        default: 'pending',
        index: true
    },
    sessionId: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function(v) {
                return v ? /^cs_(test|live)_[a-zA-Z0-9]+$/.test(v) : true;
            },
            message: 'Invalid Stripe Session ID format'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'wallet', 'other'],
        default: 'card'
    },
    receiptUrl: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+\..+$/.test(v);
            },
            message: 'Invalid receipt URL'
        }
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes
PurchaseSchema.index({ userId: 1 });
PurchaseSchema.index({ courseId: 1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index(
    { userId: 1, courseId: 1 }, 
    { unique: true, partialFilterExpression: { status: 'completed' } }
);

// Virtuals
PurchaseSchema.virtual('amountFormatted').get(function() {
    return (this.amount / 100).toFixed(2);
});

PurchaseSchema.virtual('course', {
    ref: 'Course',
    localField: 'courseId',
    foreignField: '_id',
    justOne: true
});

PurchaseSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Statics
PurchaseSchema.statics = {
    async findByUser(userId) {
        return this.find({ userId })
            .populate('course', 'title thumbnail price educator')
            .sort({ createdAt: -1 });
    },
    
    async findActiveByCourse(courseId) {
        return this.find({ 
            courseId, 
            status: { $in: ['completed', 'pending'] } 
        });
    },
    
    async getPurchaseStats(courseId) {
        return this.aggregate([
            { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }}
        ]);
    }
};

// Methods
PurchaseSchema.methods = {
    async getReceipt() {
        if (!this.receiptUrl && this.sessionId) {
            // Logic to generate receipt URL if missing
            this.receiptUrl = `https://dashboard.stripe.com/payments/${this.sessionId}`;
            await this.save();
        }
        return this.receiptUrl;
    }
};

// Hooks
PurchaseSchema.pre('save', async function(next) {
    if (this.isModified('status') && this.status === 'completed') {
        if (!this.paymentMethod) this.paymentMethod = 'card';
        this.metadata.completedAt = new Date();
        
        // Add user to course's enrolledStudents if not already there
        const Course = mongoose.model('Course');
        await Course.findByIdAndUpdate(
            this.courseId,
            { $addToSet: { enrolledStudents: this.userId } }
        );
    }
    next();
});

export const Purchase = mongoose.model('Purchase', PurchaseSchema);