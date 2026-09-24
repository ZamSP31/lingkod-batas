const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Retrieves notifications for the logged-in user with unread count.
 */
const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const unreadOnly = req.query.unreadOnly === "true";

  const filter = { recipient: req.user._id };
  if (unreadOnly) {
    filter.read = false;
  }

  const [rawNotifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("contract", "requestNumber title status"),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  const notifications = rawNotifications.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    occurredAt: n.createdAt.toISOString(),
    read: n.read,
    link: n.link,
    contractId: n.contract?._id ? n.contract._id.toString() : null,
  }));

  res.status(200).json({
    unreadCount,
    notifications,
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read for the logged-in user.
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  notification.read = true;
  await notification.save();

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({
    message: "Notification marked as read.",
    notification: {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      occurredAt: notification.createdAt.toISOString(),
      read: notification.read,
      link: notification.link,
      contractId: notification.contract
        ? notification.contract.toString()
        : null,
    },
    unreadCount,
  });
});

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read for the logged-in user.
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } },
  );

  res.status(200).json({
    message: "All notifications marked as read.",
    updatedCount: result.modifiedCount,
    unreadCount: 0,
  });
});

/**
 * DELETE /api/notifications/:id
 * Deletes a single notification.
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({
    message: "Notification removed.",
    unreadCount,
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
