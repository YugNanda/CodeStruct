const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/multer');
const cloudinary = require('../utils/cloudinary');
const getdataUri = require('../utils/datauri');

// Middleware to protect routes (could be moved to a separate file)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @desc    Upload user profile image
// @route   POST /api/user/profile-image
// @access  Private
router.post('/profile-image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const fileUri = getdataUri(req.file);

        // Upload to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(fileUri, {
            folder: "dsa_visualizer_profiles",
            width: 500,
            crop: "scale"
        });

        const user = await User.findById(req.user._id);

        // Save URL string to DB
        user.profileImage = cloudResponse.secure_url;
        await user.save();

        res.json({
            message: 'Profile image updated successfully',
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ message: error.message || 'Server error uploading image' });
    }
});

module.exports = router;
