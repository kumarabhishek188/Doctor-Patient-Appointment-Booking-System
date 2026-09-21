const express = require('express');
const { NotificationModel } = require('../models/notificationModel');
const { authentication } = require('../middlewares/authenticationMiddleware');
const notificationRoute = express.Router();

// Get all notifications for the logged-in user
notificationRoute.get('/', authentication, async (req, res) => {
  try {
    const userId = req.body.userId;
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error fetching notifications', error: error.message });
  }
});

// Mark all notifications read when the user views the notification center.
notificationRoute.patch('/read-all', authentication, async (req, res) => {
  try {
    const result = await NotificationModel.updateMany({ userId: req.body.userId, read: false }, { read: true });
    res.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error updating notifications', error: error.message });
  }
});

// Mark a notification as read
notificationRoute.patch('/:id/read', authentication, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId: req.body.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, msg: 'Notification not found.' });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error updating notification', error: error.message });
  }
});

module.exports = { notificationRoute };
