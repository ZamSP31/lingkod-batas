const crypto = require("crypto");
const IDLE_MS = 60 * 60 * 1000;

async function checkSessionActivity({ token, decoded, activity = false, now = new Date(), Session }) {
  if (!Number.isFinite(decoded.iat) || !Number.isFinite(decoded.exp)) return false;
  const issuedAt = new Date(decoded.iat * 1000);
  const id = crypto.createHash("sha256").update(token).digest("hex");
  try {
    await Session.updateOne({ _id: id }, { $setOnInsert: {
      userId: decoded.id, lastActivityAt: issuedAt, expiresAt: new Date(decoded.exp * 1000),
    } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000 || !error.keyPattern?._id) throw error;
  }
  const filter = { _id: id, userId: decoded.id,
    lastActivityAt: { $gt: new Date(now.getTime() - IDLE_MS) }, expiresAt: { $gt: now } };
  if (activity) {
    return Boolean(await Session.findOneAndUpdate(filter, { $max: { lastActivityAt: now } }, { new: true }));
  }
  return Boolean(await Session.exists(filter));
}
module.exports = { IDLE_MS, checkSessionActivity };
