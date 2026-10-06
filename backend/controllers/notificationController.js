const Notification = require("../models/Notification");

// @route  GET /api/notifications/mine
// @desc   Get logged-in user's notifications, newest first
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("Get notifications error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// @route  PUT /api/notifications/:id/read
// @desc   Mark one notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    console.error("Mark notification as read error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// @route  PUT /api/notifications/read-all
// @desc   Mark all user's notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Mark all notifications as read error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// @route  DELETE /api/notifications/:id
// @desc   Delete logged-in user's notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,

      // IMPORTANT:
      // The Notification model uses "recipient",
      // not "user".
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      message: "Failed to delete notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};