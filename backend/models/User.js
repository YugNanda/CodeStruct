const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Algorithm progress sub-schema
const algorithmProgressSchema = new mongoose.Schema({
    algorithmId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'practiced', 'mastered'],
        default: 'not_started'
    },
    practiceCount: {
        type: Number,
        default: 0
    },
    totalTimeSpent: {
        type: Number,
        default: 0 // in seconds
    },
    lastPracticed: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, { _id: false });

// Achievement sub-schema
const achievementSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    unlockedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Streak sub-schema
const streakSchema = new mongoose.Schema({
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastPracticeDate: {
        type: Date
    },
    totalPracticeDays: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Learning path progress sub-schema
const learningPathProgressSchema = new mongoose.Schema({
    pathId: {
        type: String,
        required: true
    },
    completedSteps: [{
        type: String
    }],
    currentStep: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, { _id: false });

// Practice session sub-schema
const practiceSessionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    algorithms: [{
        algorithmId: String,
        timeSpent: Number // in seconds
    }],
    totalTime: {
        type: Number,
        default: 0
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    profileImage: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    // Progress Tracking Fields
    progress: {
        type: Map,
        of: algorithmProgressSchema,
        default: {}
    },
    achievements: [achievementSchema],
    streaks: {
        type: streakSchema,
        default: () => ({})
    },
    favorites: [{
        type: String
    }],
    skillLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Master'],
        default: 'Beginner'
    },
    totalPracticeTime: {
        type: Number,
        default: 0 // in seconds
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    learningPathProgress: [learningPathProgressSchema],
    practiceHistory: [practiceSessionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    verifyOtp: {
        type: String,
        default: null
    },
    verifyOtpExpiry: {
        type: Date,
        default: null
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
