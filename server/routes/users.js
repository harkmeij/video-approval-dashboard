const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('./auth');

// Middleware to check if user is an editor
const isEditor = (req, res, next) => {
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Access denied. Editor role required.' });
  }
  next();
};

// @route   GET /api/users
// @desc    Get all users (editors only)
// @access  Private (Editor only)
router.get('/', verifyToken, isEditor, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/clients
// @desc    Get all client users (editors only)
// @access  Private (Editor only)
router.get('/clients', verifyToken, isEditor, async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }, '-password');
    res.json(clients);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (editors only)
// @access  Private (Editor only)
router.get('/:id', verifyToken, isEditor, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate URL format
const validateUrl = (url) => {
  if (!url) return true; // Allow empty
  
  // Basic URL validation
  const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
  return urlPattern.test(url);
};

// Normalize and validate keywords
const normalizeKeywords = (keywords) => {
  if (!keywords || !Array.isArray(keywords)) return [];
  
  // Normalize and filter keywords
  return keywords
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0 && k.length <= 30) // Length validation
    .filter((k, i, arr) => arr.indexOf(k) === i); // Remove duplicates
};

// @route   PUT /api/users/:id
// @desc    Update user (editors only)
// @access  Private (Editor only)
router.put('/:id', verifyToken, isEditor, async (req, res) => {
  const { name, email, role, website_url, keywords, location } = req.body;
  
  // Validate website_url if provided
  if (website_url && !validateUrl(website_url)) {
    return res.status(400).json({ message: 'Invalid website URL format' });
  }
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
  
  // Handle new fields
  if (website_url !== undefined) {
    // Ensure URL has a protocol
    if (website_url && !website_url.startsWith('http://') && !website_url.startsWith('https://')) {
      userFields.website_url = 'https://' + website_url;
    } else {
      userFields.website_url = website_url;
    }
  }
  
  if (keywords) userFields.keywords = normalizeKeywords(keywords);
  if (location !== undefined) userFields.location = location;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    );
    
    // Remove password from response
    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.json(user);
    }
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (editors only)
// @access  Private (Editor only)
router.delete('/:id', verifyToken, isEditor, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting the last editor
    if (user.role === 'editor') {
      const editorCount = await User.countDocuments({ role: 'editor' });
      if (editorCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last editor account' });
      }
    }
    
    // Delete user from both Supabase Auth and our users table
    const supabase = require('../config/supabase');
    
    // First delete from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(req.params.id);
    
    if (authDeleteError) {
      console.error('Error deleting user from Supabase Auth:', authDeleteError);
      // Continue with deletion from users table even if Auth deletion fails
    } else {
      console.log(`Deleted user from Supabase Auth with ID: ${req.params.id}`);
    }
    
    // Then delete from users table
    await User.deleteOne(req.params.id);
    console.log(`Deleted user from users table with ID: ${req.params.id}`);
    
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', verifyToken, async (req, res) => {
  const { name } = req.body;
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  
  try {
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    );
    
    // Remove password from response
    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.json(user);
    }
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/password
// @desc    Update current user's password
// @access  Private
router.put('/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await User.comparePassword(req.user.id, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const { hashPassword } = require('../utils/passwordUtils');
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await User.save({
      id: req.user.id,
      password: hashedPassword
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
