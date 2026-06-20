const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Achievement definitions
const ACHIEVEMENTS = [
    {
        id: 'first_sort',
        name: 'First Sort',
        description: 'Complete your first sorting algorithm',
        icon: '🏆',
        condition: (progress) => {
            const sortingAlgorithms = ['bubble-sort', 'selection-sort', 'quick-sort', 'merge-sort', 'heap-sort', 'insertion-sort', 'radix-sort'];
            return sortingAlgorithms.some(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'first_search',
        name: 'First Find',
        description: 'Complete your first search algorithm',
        icon: '🔍',
        condition: (progress) => {
            const searchAlgorithms = ['linear-search', 'binary-search', 'interpolation-search'];
            return searchAlgorithms.some(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'first_graph',
        name: 'Graph Explorer',
        description: 'Complete your first graph algorithm',
        icon: '🗺️',
        condition: (progress) => {
            const graphAlgorithms = ['depth-first-search', 'dijkstra', 'prims', 'kruskal', 'astar-search', 'topological-sort'];
            return graphAlgorithms.some(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'ten_algorithms',
        name: 'Dedicated Learner',
        description: 'Master 10 algorithms',
        icon: '📚',
        condition: (progress) => {
            const masteredCount = Object.values(progress || {}).filter(p => p.status === 'mastered').length;
            return masteredCount >= 10;
        }
    },
    {
        id: 'five_mastered',
        name: 'Getting Serious',
        description: 'Master 5 algorithms',
        icon: '⭐',
        condition: (progress) => {
            const masteredCount = Object.values(progress || {}).filter(p => p.status === 'mastered').length;
            return masteredCount >= 5;
        }
    },
    {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Practice for 7 days in a row',
        icon: '🔥',
        condition: (user) => {
            return user.streaks?.currentStreak >= 7;
        }
    },
    {
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Practice for 30 days in a row',
        icon: '💪',
        condition: (user) => {
            return user.streaks?.currentStreak >= 30;
        }
    },
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete an algorithm visualization in under 30 seconds',
        icon: '⚡',
        condition: (progress, sessionTime) => {
            return sessionTime && sessionTime < 30;
        }
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Practice after midnight',
        icon: '🦉',
        condition: () => {
            const hour = new Date().getHours();
            return hour >= 0 && hour < 5;
        }
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Practice before 6 AM',
        icon: '🌅',
        condition: () => {
            const hour = new Date().getHours();
            return hour >= 5 && hour < 6;
        }
    },
    {
        id: 'sorting_master',
        name: 'Sorting Master',
        description: 'Master all sorting algorithms',
        icon: '🏅',
        condition: (progress) => {
            const sortingAlgorithms = ['bubble-sort', 'selection-sort', 'quick-sort', 'merge-sort', 'heap-sort', 'insertion-sort', 'radix-sort'];
            return sortingAlgorithms.every(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'search_master',
        name: 'Search Master',
        description: 'Master all search algorithms',
        icon: '🎯',
        condition: (progress) => {
            const searchAlgorithms = ['linear-search', 'binary-search', 'interpolation-search'];
            return searchAlgorithms.every(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'graph_master',
        name: 'Graph Guru',
        description: 'Master all graph algorithms',
        icon: '🧠',
        condition: (progress) => {
            const graphAlgorithms = ['depth-first-search', 'dijkstra', 'prims', 'kruskal', 'astar-search', 'topological-sort'];
            return graphAlgorithms.every(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'linked_list_master',
        name: 'List Legend',
        description: 'Master linked list operations',
        icon: '🔗',
        condition: (progress) => {
            return progress['linked-list']?.status === 'mastered';
        }
    },
    {
        id: 'huffman_master',
        name: 'Compression Pro',
        description: 'Master Huffman coding',
        icon: '📦',
        condition: (progress) => {
            return progress['huffman-coding']?.status === 'mastered';
        }
    },
    {
        id: 'practice_100',
        name: 'Century Club',
        description: 'Practice 100 times total',
        icon: '💯',
        condition: (progress) => {
            const totalPractices = Object.values(progress || {}).reduce((sum, p) => sum + (p.practiceCount || 0), 0);
            return totalPractices >= 100;
        }
    },
    {
        id: 'practice_50',
        name: 'Half Century',
        description: 'Practice 50 times total',
        icon: '🎖️',
        condition: (progress) => {
            const totalPractices = Object.values(progress || {}).reduce((sum, p) => sum + (p.practiceCount || 0), 0);
            return totalPractices >= 50;
        }
    },
    {
        id: 'hour_practice',
        name: 'Time Invested',
        description: 'Practice for 1 hour total',
        icon: '⏰',
        condition: (progress, sessionTime, user) => {
            return (user.totalPracticeTime || 0) >= 3600;
        }
    },
    {
        id: 'beginner_complete',
        name: 'Beginner Complete',
        description: 'Complete all beginner algorithms',
        icon: '🌱',
        condition: (progress) => {
            const beginnerAlgorithms = ['bubble-sort', 'selection-sort', 'linear-search', 'binary-search', 'insertion-sort'];
            return beginnerAlgorithms.every(id => progress[id]?.status === 'mastered');
        }
    },
    {
        id: 'all_complete',
        name: 'DSA Master',
        description: 'Master all algorithms on the platform',
        icon: '👑',
        condition: (progress) => {
            const allAlgorithms = [
                'bubble-sort', 'selection-sort', 'quick-sort', 'merge-sort', 'heap-sort', 'insertion-sort', 'radix-sort',
                'linear-search', 'binary-search', 'interpolation-search',
                'linked-list', 'depth-first-search', 'dijkstra', 'prims', 'kruskal', 'astar-search', 'topological-sort',
                'huffman-coding', 'floyd-warshall'
            ];
            return allAlgorithms.every(id => progress[id]?.status === 'mastered');
        }
    }
];

// @desc    Get all achievements (with unlock status)
// @route   GET /api/achievements
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

        // Get unlocked achievements
        const unlockedIds = user.achievements?.map(a => a.id) || [];

        // Build achievements list with status
        const achievements = ACHIEVEMENTS.map(achievement => ({
            ...achievement,
            unlocked: unlockedIds.includes(achievement.id),
            unlockedAt: user.achievements?.find(a => a.id === achievement.id)?.unlockedAt
        }));

        res.json({
            achievements,
            unlockedCount: unlockedIds.length,
            totalCount: ACHIEVEMENTS.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check and unlock new achievements
// @route   POST /api/achievements/check
// @access  Private
router.post('/check', protect, async (req, res) => {
    try {
        const { sessionTime } = req.body;
        const user = await User.findById(req.user._id);

        // Convert Map to Object
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        // Check each achievement
        const unlockedIds = user.achievements?.map(a => a.id) || [];
        const newAchievements = [];

        for (const achievement of ACHIEVEMENTS) {
            if (!unlockedIds.includes(achievement.id)) {
                const isUnlocked = achievement.condition(progress, sessionTime, user);
                if (isUnlocked) {
                    user.achievements = user.achievements || [];
                    user.achievements.push({
                        id: achievement.id,
                        name: achievement.name,
                        description: achievement.description,
                        unlockedAt: new Date()
                    });
                    newAchievements.push(achievement);
                }
            }
        }

        if (newAchievements.length > 0) {
            await user.save();
        }

        res.json({
            newAchievements,
            totalUnlocked: user.achievements?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get specific achievement details
// @route   GET /api/achievements/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        const user = await User.findById(req.user._id);
        const unlockedAchievement = user.achievements?.find(a => a.id === id);

        res.json({
            ...achievement,
            unlocked: !!unlockedAchievement,
            unlockedAt: unlockedAchievement?.unlockedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
