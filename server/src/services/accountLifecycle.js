const { DAY_MS, oneYearFrom } = require("../utils/accountLifetime");

function createAccountLifecycle({ User, sendWarning, eraseAccount, logAction, clock = () => new Date() }) {
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      const now = clock();
      // Bounded initialization: legacy accounts receive a full notice period after actual delivery.
      const legacy = await User.find({ role: "client", accountExpiresAt: null,
        accountDeletionStartedAt: null }).limit(100);
      for (const user of legacy) {
        if (!user.createdAt) continue;
        await User.updateOne({ _id: user._id, role: "client", accountExpiresAt: null },
          { $set: { accountExpiresAt: oneYearFrom(user.createdAt) } });
      }
      for (let i = 0; i < 100; i++) {
        const user = await User.findOneAndUpdate({ role: "client", isActive: true,
          accountDeletionStartedAt: null, accountWarningSentAt: null,
          accountExpiresAt: { $lte: new Date(now.getTime() + 30 * DAY_MS) },
          $or: [{ accountWarningLeaseUntil: null }, { accountWarningLeaseUntil: { $lte: now } }],
        }, { $set: { accountWarningLeaseUntil: new Date(now.getTime() + 10 * 60 * 1000) } }, { new: true });
        if (!user) break;
        const deadline = new Date(Math.max(new Date(user.accountExpiresAt).getTime(), now.getTime() + 30 * DAY_MS));
        const filter = { _id: user._id, role: "client", isActive: true,
          accountExpiresAt: user.accountExpiresAt, accountWarningSentAt: null,
          accountWarningLeaseUntil: user.accountWarningLeaseUntil, accountDeletionStartedAt: null };
        try {
          const result = await sendWarning(user, deadline);
          if (!result?.delivered) throw new Error("Expiry warning was not delivered");
          const saved = await User.updateOne(filter, { $set: { accountWarningSentAt: now,
            accountDeleteAfter: deadline, accountWarningLeaseUntil: null } });
          if (saved.modifiedCount) await logAction({ user, action: "ACCOUNT_EXPIRY_WARNING", entityType: "user",
            entityId: String(user._id), details: { deleteAfter: deadline } });
        } catch {
          // Keep the lease for a bounded retry delay; failed/simulated email never authorizes deletion.
          console.warn("Account expiry warning failed; deletion remains blocked.");
        }
      }
      const pending = await User.find({ role: "client", accountDeletionStartedAt: { $ne: null } }).limit(100);
      for (const user of pending) await erase(user);
      for (let i = 0; i < 100; i++) {
        const user = await User.findOneAndUpdate({ role: "client", isActive: true,
          accountDeletionStartedAt: null, accountExpiresAt: { $lte: now },
          accountDeleteAfter: { $ne: null, $lte: now },
          accountWarningSentAt: { $ne: null, $lte: new Date(now.getTime() - 30 * DAY_MS) },
        }, { $set: { isActive: false, accountDeletionStartedAt: now }, $inc: { sessionVersion: 1 } }, { new: true });
        if (!user) break;
        await erase(user);
      }
    } finally { running = false; }
  }
  async function erase(user) {
    const now = clock();
    const claimed = await User.findOneAndUpdate({ _id: user._id, role: "client", isActive: false,
      accountDeletionStartedAt: { $ne: null },
      $or: [{ accountCleanupLeaseUntil: null }, { accountCleanupLeaseUntil: { $lte: now } }],
    }, { $set: { accountCleanupLeaseUntil: new Date(now.getTime() + 30 * 60 * 1000) } }, { new: true });
    if (!claimed) return;
    try {
      await eraseAccount(user._id, { strictStorage: true });
      await logAction({ userRole: "system", action: "ACCOUNT_EXPIRED_DELETED", entityType: "user",
        entityId: String(user._id), details: { reason: "annual_client_expiry" } });
    } catch { console.warn("Expired account cleanup incomplete; retry scheduled."); }
  }
  return { tick };
}
function startAccountLifecycle() {
  const { sendStatusNotificationEmail } = require("./emailService");
  const worker = createAccountLifecycle({ User: require("../models/User"),
    eraseAccount: require("./authService").deleteAccount, logAction: require("./auditService").logAction,
    sendWarning: (user, deadline) => sendStatusNotificationEmail({ toEmail: user.email,
      fullName: user.fullName, title: "Your account is scheduled for deletion",
      message: `Your client account and associated contracts are scheduled for deletion on ${deadline.toISOString().slice(0, 10)}. Sign in and complete OTP verification before then to renew your account for one year.`,
      link: `${process.env.CLIENT_URL}/login` }),
  });
  const run = () => worker.tick().catch(() => console.warn("Account lifecycle check failed; will retry."));
  void run();
  const timer = setInterval(run, 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
module.exports = { createAccountLifecycle, startAccountLifecycle };
