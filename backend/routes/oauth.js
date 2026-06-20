const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Initiate Google OAuth
// @route   GET /api/oauth/google
// @access  Public
router.get('/google', (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
});

// @desc    Google OAuth Callback
// @route   GET /api/oauth/callback/google
// @access  Public
router.get('/callback/google', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
    }

    try {
        // Exchange code for Google Access Token
        const url = 'https://oauth2.googleapis.com/token';
        const values = {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        };

        const tokenParams = new URLSearchParams(values);
        const tokenRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error('Google token error:', tokenData.error);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Google authorization failed`);
        }

        const id_token = tokenData.id_token;
        const access_token = tokenData.access_token;

        // Get user info from Google
        const googleUserRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
            headers: {
                Authorization: `Bearer ${id_token}`,
            },
        });

        const googleUser = await googleUserRes.json();

        if (!googleUser.email) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Google email not found`);
        }

        // Check if user exists in DB
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            // Generate a random secure password for OAuth users
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + 'A1!';

            // Create user
            user = await User.create({
                name: googleUser.name || 'Google User',
                email: googleUser.email,
                password: randomPassword
            });
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&profileImage=${encodeURIComponent(user.profileImage || '')}`);

    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=Server error during authorization`);
    }
});

module.exports = router;
