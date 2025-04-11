const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const mongoose = require('mongoose');

// Get all jobs for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching jobs for user:', req.user._id);
    const jobs = await Job.find({ user: req.user._id })
      .sort({ applicationDate: -1, createdAt: -1 });
    console.log('Found jobs:', jobs.length);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Convert userId to ObjectId safely
    const userId = req.user._id;
    
    const stats = await Job.aggregate([
      { 
        $match: { 
          user: userId 
        } 
      },
      {
        $group: {
          _id: { $toLower: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize default stats
    const statsObject = {
      applied: 0,
      interview: 0,
      rejected: 0,
      offer: 0
    };

    // Update with actual counts
    stats.forEach(stat => {
      if (stat._id && statsObject.hasOwnProperty(stat._id)) {
        statsObject[stat._id] = stat.count;
      }
    });

    res.json(statsObject);
  } catch (error) {
    console.error('Stats aggregation error:', error);
    res.status(500).json({ message: 'Error calculating job statistics' });
  }
});

// Create a new job
router.post('/', auth, async (req, res) => {
  try {
    const { company, position, status, notes, applicationDate } = req.body;
    
    console.log('Received job data:', { company, position, status, notes, applicationDate });
    console.log('User from auth:', req.user._id); // Debug log
    
    // Validate required fields
    if (!company || !position) {
      return res.status(400).json({ message: 'Company and position are required' });
    }

    // Validate status
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Validate application date
    let parsedDate = applicationDate ? new Date(applicationDate) : new Date();
    if (applicationDate && isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid application date format' });
    }

    // Create new job with all fields
    const job = new Job({
      company,
      position,
      status: status || 'Applied',
      notes,
      applicationDate: parsedDate,
      user: req.user._id // Use the authenticated user's ID
    });

    // Save the job
    await job.save();
    console.log('Job saved successfully:', job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Invalid job data', 
        errors: errors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a job
router.put('/:id', auth, async (req, res) => {
  try {
    const { company, position, status, notes, applicationDate } = req.body;
    
    console.log('Updating job:', req.params.id);
    console.log('Update data:', { company, position, status, notes, applicationDate });

    // Validate required fields
    if (!company || !position) {
      return res.status(400).json({ message: 'Company and position are required' });
    }

    // Validate status
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Validate application date
    let parsedDate = applicationDate ? new Date(applicationDate) : undefined;
    if (applicationDate && isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid application date format' });
    }

    // Update the job
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, // Use _id instead of userId
      { 
        company, 
        position, 
        status, 
        notes,
        ...(parsedDate && { applicationDate: parsedDate })
      },
      { new: true }
    );
    
    if (!job) {
      console.log('Job not found:', req.params.id);
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log('Job updated successfully:', job);
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Invalid job data', 
        errors: errors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a job
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Attempting to delete job:', req.params.id);
    console.log('User ID:', req.user._id);

    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id  // Changed from req.user.userId to req.user._id
    });
    
    if (!job) {
      console.log('Job not found for deletion');
      return res.status(404).json({ message: 'Job not found' });
    }
    
    console.log('Job deleted successfully:', job);
    res.json({ message: 'Job deleted successfully', job });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 