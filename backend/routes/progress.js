const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all algorithm progress for user
// @route   GET /api/progress
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Convert Map to Object for response
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        res.json({
            progress,
            skillLevel: user.skillLevel,
            totalPracticeTime: user.totalPracticeTime,
            xp: user.xp,
            level: user.level
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update algorithm progress
// @route   PUT /api/progress/:algorithmId
// @access  Private
router.put('/:algorithmId', protect, async (req, res) => {
    try {
        const { status, timeSpent } = req.body;
        const { algorithmId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user.progress) {
            user.progress = new Map();
        }

        const existingProgress = user.progress.get(algorithmId) || {
            algorithmId,
            status: 'not_started',
            practiceCount: 0,
            totalTimeSpent: 0,
            lastPracticed: null,
            completedAt: null
        };

        // Update progress
        existingProgress.practiceCount += 1;
        existingProgress.totalTimeSpent += timeSpent || 0;
        existingProgress.lastPracticed = new Date();

        if (status === 'practiced' && existingProgress.status === 'not_started') {
            existingProgress.status = 'practiced';
        }

        if (status === 'mastered') {
            existingProgress.status = 'mastered';
            existingProgress.completedAt = new Date();
        }

        user.progress.set(algorithmId, existingProgress);

        // Update total practice time
        user.totalPracticeTime += timeSpent || 0;
        user.updatedAt = new Date();

        // Award XP
        const xpGained = status === 'mastered' ? 50 : (status === 'practiced' ? 20 : 10);
        user.xp += xpGained;

        // Check for level up (every 100 XP = 1 level)
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
            user.level = newLevel;
        }

        // Update skill level based on progress
        const masteredCount = Array.from(user.progress.values()).filter(p => p.status === 'mastered').length;
        const practicedCount = Array.from(user.progress.values()).filter(p => p.status === 'practiced').length;
        const totalCount = masteredCount + practicedCount;

        if (totalCount >= 15 && masteredCount >= 10) {
            user.skillLevel = 'Master';
        } else if (totalCount >= 10 && masteredCount >= 5) {
            user.skillLevel = 'Advanced';
        } else if (totalCount >= 5 && masteredCount >= 2) {
            user.skillLevel = 'Intermediate';
        } else {
            user.skillLevel = 'Beginner';
        }

        await user.save();

        res.json({
            message: 'Progress updated',
            progress: Object.fromEntries(user.progress),
            xp: user.xp,
            level: user.level,
            skillLevel: user.skillLevel,
            xpGained
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get specific algorithm progress
// @route   GET /api/progress/:algorithmId
// @access  Private
router.get('/:algorithmId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { algorithmId } = req.params;

        const progress = user.progress?.get(algorithmId) || {
            algorithmId,
            status: 'not_started',
            practiceCount: 0,
            totalTimeSpent: 0,
            lastPracticed: null,
            completedAt: null
        };

        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reset algorithm progress
// @route   DELETE /api/progress/:algorithmId
// @access  Private
router.delete('/:algorithmId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { algorithmId } = req.params;

        if (user.progress) {
            user.progress.delete(algorithmId);
            await user.save();
        }

        res.json({ message: 'Progress reset for algorithm' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
