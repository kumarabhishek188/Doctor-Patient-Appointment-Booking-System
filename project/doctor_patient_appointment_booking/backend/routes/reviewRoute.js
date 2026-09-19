const express = require('express');
const { ReviewModel } = require('../models/reviewModel');
const { authentication } = require('../middlewares/authenticationMiddleware');
const { authorisation } = require('../middlewares/authorizationMiddleware');
const reviewRoute = express.Router();

// Submit a review (patient only)
reviewRoute.post('/', authentication, authorisation(['patient']), async (req, res) => {
  try {
    const { doctorId, rating, review, bookingId } = req.body;
    const patientId = req.body.userId;
    const patientName = req.body.userEmail;
    if (!doctorId || !rating || !bookingId) {
      return res.status(400).json({ success: false, msg: 'Doctor, rating, and bookingId required.' });
    }
    let exists;
    if (bookingId === 'general') {
      // Only one general review per user per doctor
      exists = await ReviewModel.findOne({ doctorId, patientId, bookingId: 'general' });
    } else {
      // Only one review per user per appointment
      exists = await ReviewModel.findOne({ doctorId, patientId, bookingId });
    }
    if (exists) {
      return res.status(409).json({ success: false, msg: 'You have already reviewed this doctor.' });
    }
    await ReviewModel.create({ doctorId, patientId, patientName, rating, review, bookingId });
    res.status(201).json({ success: true, msg: 'Review submitted.' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error submitting review', error: error.message });
  }
});

// Get all reviews for a doctor
reviewRoute.get('/:doctorId', async (req, res) => {
  try {
    const reviews = await ReviewModel.find({ doctorId: req.params.doctorId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error fetching reviews', error: error.message });
  }
});

// Get average rating for a doctor
reviewRoute.get('/average/:doctorId', async (req, res) => {
  try {
    const result = await ReviewModel.aggregate([
      { $match: { doctorId: req.params.doctorId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    if (result.length === 0) {
      return res.json({ avgRating: 0, count: 0 });
    }
    res.json({ avgRating: result[0].avgRating, count: result[0].count });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error fetching average rating', error: error.message });
  }
});

module.exports = { reviewRoute };
