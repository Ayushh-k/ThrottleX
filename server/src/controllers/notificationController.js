const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.refreshSystemAlerts();
    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating notification.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error marking notifications.' });
  }
};
