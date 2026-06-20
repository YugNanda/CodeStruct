const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Learning path definitions
const LEARNING_PATHS = [
    {
        id: 'sorting-basics',
        name: 'Sorting Basics',
        description: 'Master fundamental sorting algorithms',
        difficulty: 'Beginner',
        icon: '🧮',
        steps: [
            { algorithmId: 'bubble-sort', title: 'Bubble Sort', order: 1 },
            { algorithmId: 'selection-sort', title: 'Selection Sort', order: 2 },
            { algorithmId: 'insertion-sort', title: 'Insertion Sort', order: 3 }
        ]
    },
    {
        id: 'advanced-sorting',
        name: 'Advanced Sorting',
        description: 'Learn efficient divide-and-conquer sorting algorithms',
        difficulty: 'Intermediate',
        icon: '⚡',
        steps: [
            { algorithmId: 'merge-sort', title: 'Merge Sort', order: 1 },
            { algorithmId: 'quick-sort', title: 'Quick Sort', order: 2 },
            { algorithmId: 'heap-sort', title: 'Heap Sort', order: 3 },
            { algorithmId: 'radix-sort', title: 'Radix Sort', order: 4 }
        ]
    },
    {
        id: 'search-fundamentals',
        name: 'Search Fundamentals',
        description: 'Learn essential searching techniques',
        difficulty: 'Beginner',
        icon: '🔍',
        steps: [
            { algorithmId: 'linear-search', title: 'Linear Search', order: 1 },
            { algorithmId: 'binary-search', title: 'Binary Search', order: 2 }
        ]
    },
    {
        id: 'advanced-searching',
        name: 'Advanced Searching',
        description: 'Master complex search algorithms',
        difficulty: 'Intermediate',
        icon: '🎯',
        steps: [
            { algorithmId: 'interpolation-search', title: 'Interpolation Search', order: 1 },
            { algorithmId: 'depth-first-search', title: 'Depth First Search', order: 2 }
        ]
    },
    {
        id: 'graph-traversal',
        name: 'Graph Traversal',
        description: 'Learn to navigate graphs and trees',
        difficulty: 'Intermediate',
        icon: '🗺️',
        steps: [
            { algorithmId: 'depth-first-search', title: 'DFS', order: 1 },
            { algorithmId: 'dijkstra', title: "Dijkstra's Algorithm", order: 2 },
            { algorithmId: 'prims', title: "Prim's Algorithm", order: 3 }
        ]
    },
    {
        id: 'mst-algorithms',
        name: 'Minimum Spanning Trees',
        description: 'Learn MST algorithms for network design',
        difficulty: 'Advanced',
        icon: '🌐',
        steps: [
            { algorithmId: 'prims', title: "Prim's Algorithm", order: 1 },
            { algorithmId: 'kruskal', title: "Kruskal's Algorithm", order: 2 }
        ]
    },
    {
        id: 'pathfinding',
        name: 'Pathfinding',
        description: 'Master shortest path algorithms',
        difficulty: 'Advanced',
        icon: '🛤️',
        steps: [
            { algorithmId: 'dijkstra', title: "Dijkstra's Algorithm", order: 1 },
            { algorithmId: 'astar-search', title: 'A* Search', order: 2 },
            { algorithmId: 'floyd-warshall', title: 'Floyd Warshall', order: 3 }
        ]
    },
    {
        id: 'complete-beginner',
        name: 'Complete Beginner',
        description: 'Your journey to DSA mastery starts here',
        difficulty: 'Beginner',
        icon: '🌱',
        steps: [
            { algorithmId: 'linear-search', title: 'Linear Search', order: 1 },
            { algorithmId: 'binary-search', title: 'Binary Search', order: 2 },
            { algorithmId: 'bubble-sort', title: 'Bubble Sort', order: 3 },
            { algorithmId: 'selection-sort', title: 'Selection Sort', order: 4 },
            { algorithmId: 'insertion-sort', title: 'Insertion Sort', order: 5 }
        ]
    },
    {
        id: 'intermediate-dsa',
        name: 'Intermediate DSA',
        description: 'Level up your algorithmic skills',
        difficulty: 'Intermediate',
        icon: '📈',
        steps: [
            { algorithmId: 'merge-sort', title: 'Merge Sort', order: 1 },
            { algorithmId: 'quick-sort', title: 'Quick Sort', order: 2 },
            { algorithmId: 'heap-sort', title: 'Heap Sort', order: 3 },
            { algorithmId: 'depth-first-search', title: 'DFS', order: 4 },
            { algorithmId: 'dijkstra', title: "Dijkstra's Algorithm", order: 5 }
        ]
    },
    {
        id: 'advanced-master',
        name: 'Advanced Master',
        description: 'Become a DSA expert',
        difficulty: 'Advanced',
        icon: '👑',
        steps: [
            { algorithmId: 'quick-sort', title: 'Quick Sort', order: 1 },
            { algorithmId: 'heap-sort', title: 'Heap Sort', order: 2 },
            { algorithmId: 'astar-search', title: 'A* Search', order: 3 },
            { algorithmId: 'kruskal', title: "Kruskal's Algorithm", order: 4 },
            { algorithmId: 'topological-sort', title: 'Topological Sort', order: 5 },
            { algorithmId: 'huffman-coding', title: 'Huffman Coding', order: 6 },
            { algorithmId: 'floyd-warshall', title: 'Floyd Warshall', order: 7 }
        ]
    }
];

// @desc    Get all learning paths
// @route   GET /api/learning-paths
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

        // Get user's path progress
        const userPathProgress = user.learningPathProgress || [];

        // Build paths with user progress
        const pathsWithProgress = LEARNING_PATHS.map(path => {
            const userPath = userPathProgress.find(p => p.pathId === path.id);
            
            const stepsWithStatus = path.steps.map(step => ({
                ...step,
                status: progress[step.algorithmId]?.status || 'not_started',
                completed: progress[step.algorithmId]?.status === 'mastered'
            }));

            const completedSteps = stepsWithStatus.filter(s => s.completed).length;
            const progressPercent = Math.round((completedSteps / path.steps.length) * 100);

            return {
                ...path,
                completedSteps,
                totalSteps: path.steps.length,
                progressPercent,
                currentStep: userPath?.currentStep || 0,
                startedAt: userPath?.startedAt,
                completedAt: userPath?.completedAt,
                isCompleted: completedSteps === path.steps.length,
                isStarted: completedSteps > 0
            };
        });

        res.json({
            paths: pathsWithProgress,
            totalPaths: LEARNING_PATHS.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get specific learning path
// @route   GET /api/learning-paths/:pathId
// @access  Private
router.get('/:pathId', protect, async (req, res) => {
    try {
        const { pathId } = req.params;
        const user = await User.findById(req.user._id);

        const path = LEARNING_PATHS.find(p => p.id === pathId);
        
        if (!path) {
            return res.status(404).json({ message: 'Learning path not found' });
        }

        // Convert Map to Object
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        const userPath = user.learningPathProgress?.find(p => p.pathId === pathId);

        const stepsWithStatus = path.steps.map(step => ({
            ...step,
            status: progress[step.algorithmId]?.status || 'not_started',
            completed: progress[step.algorithmId]?.status === 'mastered',
            practiceCount: progress[step.algorithmId]?.practiceCount || 0,
            lastPracticed: progress[step.algorithmId]?.lastPracticed
        }));

        const completedSteps = stepsWithStatus.filter(s => s.completed).length;
        
        // Determine next step
        const nextStep = stepsWithStatus.find(s => s.status !== 'mastered');

        res.json({
            ...path,
            steps: stepsWithStatus,
            completedSteps,
            progressPercent: Math.round((completedSteps / path.steps.length) * 100),
            currentStep: userPath?.currentStep || 0,
            startedAt: userPath?.startedAt,
            completedAt: userPath?.completedAt,
            isCompleted: completedSteps === path.steps.length,
            nextStep: nextStep ? nextStep.algorithmId : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Start a learning path
// @route   POST /api/learning-paths/:pathId/start
// @access  Private
router.post('/:pathId/start', protect, async (req, res) => {
    try {
        const { pathId } = req.params;
        const user = await User.findById(req.user._id);

        const path = LEARNING_PATHS.find(p => p.id === pathId);
        
        if (!path) {
            return res.status(404).json({ message: 'Learning path not found' });
        }

        // Check if already started
        const existingProgress = user.learningPathProgress?.find(p => p.pathId === pathId);
        
        if (existingProgress) {
            return res.status(400).json({ message: 'Path already started' });
        }

        // Add path progress
        user.learningPathProgress = user.learningPathProgress || [];
        user.learningPathProgress.push({
            pathId,
            completedSteps: [],
            currentStep: 0,
            startedAt: new Date()
        });

        await user.save();

        res.json({
            message: 'Learning path started',
            pathId,
            startedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get recommended paths based on skill level
// @route   GET /api/learning-paths/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Convert Map to Object
        const progress = {};
        if (user.progress) {
            user.progress.forEach((value, key) => {
                progress[key] = value;
            });
        }

        const skillLevel = user.skillLevel || 'Beginner';
        
        // Filter paths by skill level
        let recommendedPaths = LEARNING_PATHS.filter(path => 
            path.difficulty === skillLevel || 
            (skillLevel === 'Beginner' && path.difficulty === 'Beginner')
        );

        // If no paths at current level, get next level
        if (recommendedPaths.length === 0) {
            const levelOrder = ['Beginner', 'Intermediate', 'Advanced', 'Master'];
            const currentLevelIndex = levelOrder.indexOf(skillLevel);
            const nextLevel = levelOrder[Math.min(currentLevelIndex + 1, levelOrder.length - 1)];
            recommendedPaths = LEARNING_PATHS.filter(path => path.difficulty === nextLevel);
        }

        // Sort by how much progress user has made
        recommendedPaths = recommendedPaths.map(path => {
            const completedSteps = path.steps.filter(step => 
                progress[step.algorithmId]?.status === 'mastered'
            ).length;
            
            return {
                ...path,
                progressPercent: Math.round((completedSteps / path.steps.length) * 100),
                completedSteps,
                nextStep: path.steps.find(step => 
                    progress[step.algorithmId]?.status !== 'mastered'
                )
            };
        }).sort((a, b) => b.progressPercent - a.progressPercent);

        res.json({
            recommendations: recommendedPaths.slice(0, 3),
            skillLevel
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
