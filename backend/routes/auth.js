const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const { sendEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is Required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        user.verifyOtp = String(otp);
        user.verifyOtpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        const mailOption = {
            to: email,
            subject: "Reset Your Password - DSA Visualizer 🔐",
            text: `Hey User,

Your OTP for resetting your password on DSA Visualizer is ${otp}. 
This OTP is valid for 10 minutes.

Please do not share it with anyone.

— Team DSA Visualizer`
        };

        await sendEmail(mailOption);

        return res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP, and New Password are required" });
        }

        const user = await User.findOne({
            email,
            verifyOtp: otp,
            verifyOtpExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Set password directly - the pre-save hook will hash it
        user.password = newPassword;
        user.verifyOtp = null;
        user.verifyOtpExpiry = null;
        await user.save();

        return res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

module.exports = router;
