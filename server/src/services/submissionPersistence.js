const { saveContractWithRequestNumberRetry } = require("../utils/requestNumbers");

function createSubmissionPersistence(User) {
  return async (contract, userId) => saveContractWithRequestNumberRetry(contract, () =>
    User.db.transaction(async session => {
      // Serialize submission against account deactivation/deletion. Mongoose's
      // transaction wrapper restores document state when an insert rolls back.
      const owner = await User.findOneAndUpdate({ _id: userId, isActive: true, accountDeletionStartedAt: null },
        { $inc: { __v: 1 } }, { session, new: true });
      if (!owner) {
        const error = new Error("Account unavailable. The contract was not submitted.");
        error.statusCode = 401;
        throw error;
      }
      await contract.save({ session });
    }));
}

module.exports = { createSubmissionPersistence,
  persistSubmittedContract: (contract, userId) => createSubmissionPersistence(require("../models/User"))(contract, userId) };
