const express = require('express');
const router = express.Router();
const Month = require('../models/Month');
const { verifyToken } = require('./auth');

// Middleware to check if user is an editor
const isEditor = (req, res, next) => {
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Access denied. Editor role required.' });
  }
  next();
};

// @route   GET /api/months
// @desc    Get all months (editors only)
// @access  Private (Editor only)
router.get('/', verifyToken, isEditor, async (req, res) => {
  try {
    const months = await Month.find();
    res.json(months);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/months/client
// @desc    Get all months (redirects to main endpoint as months are now global)
// @access  Private
router.get('/client', verifyToken, async (req, res) => {
  try {
    const months = await Month.find();
    res.json(months);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/months/client/:clientId
// @desc    Get all months (now redirects to main endpoint as months are global)
// @access  Private
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    // Since months are now global, we just return all months regardless of client
    const months = await Month.find();
    res.json(months);
  } catch (err) {
    console.error('Error in GET /api/months/client/:clientId:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/months/:id
// @desc    Get month by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const month = await Month.findById(req.params.id);
    
    if (!month) {
      return res.status(404).json({ message: 'Month not found' });
    }
    
    // Check if user is authorized to access this month
    if (req.user.role !== 'editor' && month.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this month' });
    }
    
    res.json(month);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Month not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   POST /api/months
// @desc    Create a new month (editors only)
// @access  Private (Editor only)
router.post('/', verifyToken, isEditor, async (req, res) => {
  const { name, year, month } = req.body;
  
  try {
    // Check if month already exists globally
    const existingMonths = await Month.find({ 
      year, 
      month 
    });
    
    if (existingMonths && existingMonths.length > 0) {
      return res.status(400).json({ message: 'Month already exists' });
    }
    
    // Create new month (without client_id since months are now global)
    const newMonth = {
      name,
      year,
      month,
      created_by: req.user.id
    };
    
    const monthData = await Month.create(newMonth);
    
    res.json(monthData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/months/:id
// @desc    Update a month (editors only)
// @access  Private (Editor only)
router.put('/:id', verifyToken, isEditor, async (req, res) => {
  const { name } = req.body;
  
  // Build month object
  const monthFields = {};
  if (name) monthFields.name = name;
  
  try {
    let month = await Month.findById(req.params.id);
    
    if (!month) {
      return res.status(404).json({ message: 'Month not found' });
    }
    
    // Update month
    month = await Month.findByIdAndUpdate(
      req.params.id,
      { $set: monthFields },
      { new: true }
    );
    
    res.json(month);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Month not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/months/:id
// @desc    Delete a month (editors only)
// @access  Private (Editor only)
router.delete('/:id', verifyToken, isEditor, async (req, res) => {
  try {
    const month = await Month.findById(req.params.id);
    
    if (!month) {
      return res.status(404).json({ message: 'Month not found' });
    }
    
    // Delete month
    await Month.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Month removed' });
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Month not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
