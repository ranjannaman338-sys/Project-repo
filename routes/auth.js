const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('[Auth] Register attempt:', email);
    
    if (!name || !email || !password) {
      console.log('[Auth] Missing fields in registration');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Password strength validation (min 8 chars, 1 upper, 1 lower, 1 number, 1 special)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
      });
    }

    if (mongoose.connection.readyState !== 1) {
      console.error('[Auth] Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Service temporarily unavailable: Database connection is being established. Please try again in a few seconds.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      console.warn('[Auth] Registration failed: Email already exists -', email);
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    user = new User({ name, email: email.toLowerCase(), password });
    await user.save();
    console.log('[Auth] User saved successfully:', email);

    const secret = process.env.JWT_SECRET || 'bidSphere_dev_fallback_secret_2024';
    const token = jwt.sign({ id: user._id, name: user.name }, secret, { expiresIn: '7d' });
    console.log('[Auth] Token generated for:', email);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[Auth] Register error details:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[Auth] Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Service temporarily unavailable: Database connection is being established. Please try again in a few seconds.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('[Auth] Login failed: User not found -', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('[Auth] Found user, comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[Auth] Login failed: Password mismatch for -', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'bidSphere_dev_fallback_secret_2024';
    console.log('[Auth] Login successful:', email);
    const token = jwt.sign({ id: user._id, name: user.name }, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[Auth] Login error details:', err.message);
    res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
});

// Reset Password (Demo version without Email Verification)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password; // pre-save hook will hash this new password
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;
