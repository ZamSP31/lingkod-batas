const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lastActivityAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
module.exports = mongoose.model("AccessSession", schema);
