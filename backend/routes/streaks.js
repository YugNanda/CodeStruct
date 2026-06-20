const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper function to check if date is today
const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

// Helper function to check if date is yesterday
const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
};

// Helper function to get start of day
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// @desc    Get user streaks
// @route   GET /api/streaks
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Update streak status on fetch
        let streaks = user.streaks || {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            totalPracticeDays: 0
        };

        const lastPracticeDate = streaks.lastPracticeDate ? new Date(streaks.lastPracticeDate) : null;

        // Check if streak should be broken
        if (lastPracticeDate) {
            const today = startOfDay(new Date());
            const lastPractice = startOfDay(lastPracticeDate);
            const daysDiff = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));

            if (daysDiff > 1) {
                // Streak is broken - reset current streak
                streaks.currentStreak = 0;
                user.streaks = streaks;
                await user.save();
            }
        }

        res.json({
            currentStreak: streaks.currentStreak || 0,
            longestStreak: streaks.longestStreak || 0,
            lastPracticeDate: streaks.lastPracticeDate,
            totalPracticeDays: streaks.totalPracticeDays || 0,
            // Calculate if streak is active today
            practicedToday: lastPracticeDate ? isToday(lastPracticeDate) : false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Record practice and update streak
// @route   POST /api/streaks/practice
// @access  Private
router.post('/practice', protect, async (req, res) => {
    try {
        const { timeSpent } = req.body;
        const user = await User.findById(req.user._id);

        let streaks = user.streaks || {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            totalPracticeDays: 0
        };

        const now = new Date();
        const lastPracticeDate = streaks.lastPracticeDate ? new Date(streaks.lastPracticeDate) : null;

        // Determine if this is a new practice day
        let isNewDay = true;
        
        if (lastPracticeDate) {
            if (isToday(lastPracticeDate)) {
                // Already practiced today - just update time
                isNewDay = false;
            } else if (isYesterday(lastPracticeDate)) {
                // Practiced yesterday - increment streak
                isNewDay = true;
            } else {
                // Streak was broken - start new streak
                streaks.currentStreak = 1;
                isNewDay = true;
            }
        } else {
            // First practice ever
            streaks.currentStreak = 1;
            isNewDay = true;
        }

        if (isNewDay) {
            streaks.currentStreak += 1;
            streaks.totalPracticeDays += 1;
            streaks.lastPracticeDate = now;

            // Update longest streak
            if (streaks.currentStreak > streaks.longestStreak) {
                streaks.longestStreak = streaks.currentStreak;
            }
        }

        user.streaks = streaks;
        user.updatedAt = now;

        // Add to practice history
        const today = startOfDay(now);
        const existingSession = user.practiceHistory?.find(session => {
            const sessionDate = new Date(session.date);
            return isToday(sessionDate);
        });

        if (existingSession) {
            existingSession.totalTime += timeSpent || 0;
        } else {
            user.practiceHistory = user.practiceHistory || [];
            user.practiceHistory.push({
                date: today,
                algorithms: [],
                totalTime: timeSpent || 0
            });
            
            // Keep only last 90 days of history
            if (user.practiceHistory.length > 90) {
                user.practiceHistory = user.practiceHistory.slice(-90);
            }
        }

        // Award XP for daily practice
        if (isNewDay) {
            user.xp += 10; // Bonus XP for daily streak
        }

        await user.save();

        res.json({
            message: isNewDay ? 'Streak updated!' : 'Practice recorded',
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            totalPracticeDays: streaks.totalPracticeDays,
            practicedToday: true,
            xpGained: isNewDay ? 10 : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get practice history (calendar heatmap data)
// @route   GET /api/streaks/history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const { days = 90 } = req.query;
        const user = await User.findById(req.user._id);

        const practiceHistory = user.practiceHistory || [];
        
        // Get last N days
        const historyData = practiceHistory.slice(-parseInt(days)).map(session => ({
            date: session.date,
            totalTime: session.totalTime,
            algorithms: session.algorithms
        }));

        res.json(historyData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check streak status (for display)
// @route   GET /api/streaks/status
// @access  Private
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        const streaks = user.streaks || {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            totalPracticeDays: 0
        };

        const lastPracticeDate = streaks.lastPracticeDate ? new Date(streaks.lastPracticeDate) : null;

        // Determine streak status message
        let status = 'start';
        let message = 'Start your streak today!';
        
        if (lastPracticeDate) {
            if (isToday(lastPracticeDate)) {
                status = 'active';
                message = `🔥 ${streaks.currentStreak} day streak! Keep it up!`;
            } else if (isYesterday(lastPracticeDate)) {
                status = 'at_risk';
                message = `Practice today to maintain your ${streaks.currentStreak} day streak!`;
            } else {
                status = 'broken';
                message = 'Start a new streak today!';
            }
        }

        res.json({
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
            totalPracticeDays: streaks.totalPracticeDays,
            practicedToday: lastPracticeDate ? isToday(lastPracticeDate) : false,
            status,
            message
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
