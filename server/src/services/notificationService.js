/**
 * notificationService.js
 * In-app notification dispatcher for Lingkod Batas.
 *
 * Dispatches real-time, persistent alerts across contract lifecycle stages:
 * - contract-submitted (uploaded by client, queued for attorney)
 * - analysis-complete (OCR & RAG pipeline finished)
 * - attorney-reviewing (attorney opens workspace/claims review)
 * - report-ready (attorney finalizes review & releases report)
 */

const { createHash } = require("node:crypto");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendStatusNotificationEmail } = require("./emailService");

/**
 * Creates a single notification for a specific recipient.
 * Safe and non-blocking: errors are logged but will not disrupt the caller.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.recipient - User ID of receiver
 * @param {string|import("mongoose").Types.ObjectId} [params.contract] - Associated contract ID
 * @param {'contract-submitted'|'analysis-complete'|'attorney-reviewing'|'report-ready'} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.link] - Client or attorney route URL to open
 * @returns {Promise<import("../models/Notification")|null>}
 */
async function createNotification({
  recipient,
  contract = null,
  type,
  title,
  message,
  link = null,
}) {
  try {
    if (!recipient || !type || !title || !message) {
      // eslint-disable-next-line no-console
      console.warn(
        "[notificationService] Missing required parameters for notification",
      );
      return null;
    }

    const reviewEvent = type === "attorney-reviewing" && contract;
    const eventFilter = { recipient, contract, type };
    if (reviewEvent) {
      const existing = await Notification.findOne(eventFilter);
      if (existing) return existing;
    }
    const recipientUser = await User.findById(recipient).select(
      "notificationSettings email fullName",
    );

    if (!recipientUser) return null;
    const inAppVisible = recipientUser.notificationSettings?.inAppNotifications !== false;
    if (!reviewEvent && !inAppVisible) {
      if (recipientUser.email && recipientUser.notificationSettings?.emailNotifications !== false) {
        sendStatusNotificationEmail({ toEmail: recipientUser.email, fullName: recipientUser.fullName, title, message, link }).catch(() => {});
      }
      return null;
    }
    let notification;
    try {
      notification = await Notification.create({
        ...(reviewEvent ? { _id: createHash("sha256").update(`review-start:${String(recipient?._id ?? recipient)}:${String(contract?._id ?? contract)}`).digest("hex").slice(0, 24) } : {}),
        recipient, contract, type, title: title.trim(), message: message.trim(), link: link ? link.trim() : null,
        read: false, inAppVisible,
      });
    } catch (error) {
      if (reviewEvent && error.code === 11000) return Notification.findOne(eventFilter);
      throw error;
    }
    // Persist first so retries cannot send duplicate review-start emails.
    if (recipientUser.email && recipientUser.notificationSettings?.emailNotifications !== false) {
      sendStatusNotificationEmail({ toEmail: recipientUser.email, fullName: recipientUser.fullName, title, message, link }).catch(() => {});
    }

    return notification;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[notificationService] Failed to create notification:",
      error.message,
    );
    return null;
  }
}

/**
 * Dispatches a notification to all registered attorneys.
 * Used when clients upload new contracts or AI completes a new analysis queue.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} [params.contract]
 * @param {'contract-submitted'|'analysis-complete'|'attorney-reviewing'|'report-ready'} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.link]
 * @returns {Promise<number>} Number of notifications successfully created
 */
async function notifyAttorneys({
  contract = null,
  type,
  title,
  message,
  link = null,
}) {
  try {
    const attorneys = await User.find({ role: "attorney" }).select(
      "_id email fullName notificationSettings",
    );
    if (!attorneys.length) return 0;

    for (const attorney of attorneys) {
      if (
        attorney.email &&
        attorney.notificationSettings?.emailNotifications !== false
      ) {
        sendStatusNotificationEmail({
          toEmail: attorney.email,
          fullName: attorney.fullName,
          title,
          message,
          link,
        }).catch(() => {});
      }
    }

    const docs = attorneys
      .filter(
        (attorney) => attorney.notificationSettings?.inAppNotifications !== false,
      )
      .map((attorney) => ({
        recipient: attorney._id,
        contract,
        type,
        title: title.trim(),
        message: message.trim(),
        link: link ? link.trim() : null,
        read: false,
      }));

    if (!docs.length) return 0;

    const result = await Notification.insertMany(docs);
    return result.length;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[notificationService] Failed to notify attorneys:",
      error.message,
    );
    return 0;
  }
}

module.exports = {
  createNotification,
  notifyAttorneys,
};
