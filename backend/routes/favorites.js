const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all favorites
// @route   GET /api/favorites
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const favorites = user.favorites || [];

        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add algorithm to favorites
// @route   POST /api/favorites/:algorithmId
// @access  Private
router.post('/:algorithmId', protect, async (req, res) => {
    try {
        const { algorithmId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user.favorites) {
            user.favorites = [];
        }

        // Check if already favorited
        if (user.favorites.includes(algorithmId)) {
            return res.status(400).json({ message: 'Algorithm already in favorites' });
        }

        user.favorites.push(algorithmId);
        await user.save();

        res.json({
            message: 'Added to favorites',
            favorites: user.favorites
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Remove algorithm from favorites
// @route   DELETE /api/favorites/:algorithmId
// @access  Private
router.delete('/:algorithmId', protect, async (req, res) => {
    try {
        const { algorithmId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user.favorites) {
            user.favorites = [];
        }

        user.favorites = user.favorites.filter(id => id !== algorithmId);
        await user.save();

        res.json({
            message: 'Removed from favorites',
            favorites: user.favorites
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check if algorithm is favorited
// @route   GET /api/favorites/:algorithmId
// @access  Private
router.get('/:algorithmId', protect, async (req, res) => {
    try {
        const { algorithmId } = req.params;
        const user = await User.findById(req.user._id);

        const isFavorite = user.favorites?.includes(algorithmId) || false;

        res.json({ isFavorite });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle favorite status
// @route   PUT /api/favorites/:algorithmId
// @access  Private
router.put('/:algorithmId', protect, async (req, res) => {
    try {
        const { algorithmId } = req.params;
        const user = await User.findById(req.user._id);

        if (!user.favorites) {
            user.favorites = [];
        }

        const isFavorite = user.favorites.includes(algorithmId);

        if (isFavorite) {
            user.favorites = user.favorites.filter(id => id !== algorithmId);
        } else {
            user.favorites.push(algorithmId);
        }

        await user.save();

        res.json({
            isFavorite: !isFavorite,
            favorites: user.favorites
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
