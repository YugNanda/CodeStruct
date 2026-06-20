const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get comprehensive dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Convert Map to Object
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        // Calculate statistics
        const algorithmsProgress = Object.values(progress);
        const masteredCount = algorithmsProgress.filter(p => p.status === 'mastered').length;
        const practicedCount = algorithmsProgress.filter(p => p.status === 'practiced').length;
        const totalPracticed = masteredCount + practicedCount;

        // Calculate category progress
        const categoryProgress = {
            sorting: { total: 7, completed: 0 },
            '1d-array-searching': { total: 3, completed: 0 },
            'graph-searching': { total: 1, completed: 0 },
            'linked-list': { total: 1, completed: 0 },
            pathfinding: { total: 4, completed: 0 },
            mst: { total: 2, completed: 0 },
            greedy: { total: 1, completed: 0 }
        };

        // Map algorithm IDs to categories
        const algorithmCategories = {
            'bubble-sort': 'sorting',
            'selection-sort': 'sorting',
            'quick-sort': 'sorting',
            'merge-sort': 'sorting',
            'heap-sort': 'sorting',
            'insertion-sort': 'sorting',
            'radix-sort': 'sorting',
            'linear-search': '1d-array-searching',
            'binary-search': '1d-array-searching',
            'interpolation-search': '1d-array-searching',
            'depth-first-search': 'graph-searching',
            'linked-list': 'linked-list',
            'dijkstra': 'pathfinding',
            'astar-search': 'pathfinding',
            'floyd-warshall': 'pathfinding',
            'prims': 'mst',
            'kruskal': 'mst',
            'topological-sort': 'greedy',
            'huffman-coding': 'greedy'
        };

        // Update category progress
        Object.entries(progress).forEach(([algoId, algoProgress]) => {
            const category = algorithmCategories[algoId];
            if (category && categoryProgress[category]) {
                if (algoProgress.status === 'mastered') {
                    categoryProgress[category].completed++;
                }
            }
        });

        // Get recent activity (last 5 practiced algorithms)
        const recentActivity = algorithmsProgress
            .filter(p => p.lastPracticed)
            .sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed))
            .slice(0, 5);

        // Calculate level and XP progress
        const xpForCurrentLevel = ((user.level || 1) - 1) * 100;
        const xpForNextLevel = (user.level || 1) * 100;
        const xpProgress = ((user.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100;

        // Streaks data
        const streaks = user.streaks || {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            totalPracticeDays: 0
        };

        // Recent achievements
        const recentAchievements = (user.achievements || [])
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, 3);

        // Total algorithms count
        const totalAlgorithms = Object.keys(algorithmCategories).length;

        res.json({
            // User info
            name: user.name,
            skillLevel: user.skillLevel || 'Beginner',
            
            // Progress stats
            totalAlgorithms,
            masteredCount,
            practicedCount,
            totalPracticed,
            progressPercent: Math.round((totalPracticed / totalAlgorithms) * 100),
            
            // Category progress
            categoryProgress,
            
            // XP and Level
            xp: user.xp || 0,
            level: user.level || 1,
            xpProgress: Math.min(100, Math.max(0, xpProgress)),
            xpToNextLevel: xpForNextLevel - (user.xp || 0),
            
            // Streaks
            currentStreak: streaks.currentStreak || 0,
            longestStreak: streaks.longestStreak || 0,
            totalPracticeDays: streaks.totalPracticeDays || 0,
            practicedToday: streaks.lastPracticeDate ? 
                new Date(streaks.lastPracticeDate).toDateString() === new Date().toDateString() 
                : false,
            
            // Time stats
            totalPracticeTime: user.totalPracticeTime || 0,
            totalPracticeTimeFormatted: formatTime(user.totalPracticeTime || 0),
            
            // Recent activity
            recentActivity,
            
            // Achievements
            achievementsUnlocked: user.achievements?.length || 0,
            recentAchievements,
            
            // Favorites count
            favoritesCount: user.favorites?.length || 0,
            
            // Learning paths progress
            learningPathsStarted: user.learningPathProgress?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get quick stats
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Convert Map to Object
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        const algorithmsProgress = Object.values(progress);
        const masteredCount = algorithmsProgress.filter(p => p.status === 'mastered').length;
        const practicedCount = algorithmsProgress.filter(p => p.status === 'practiced').length;

        res.json({
            level: user.level || 1,
            xp: user.xp || 0,
            skillLevel: user.skillLevel || 'Beginner',
            masteredCount,
            practicedCount,
            currentStreak: user.streaks?.currentStreak || 0,
            totalPracticeTime: user.totalPracticeTime || 0,
            achievementsUnlocked: user.achievements?.length || 0,
            favoritesCount: user.favorites?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to format time
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

module.exports = router;
