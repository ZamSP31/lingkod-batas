const MAX_ATTEMPTS = 3;

function requestNumberYear(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", year: "numeric" }).format(date));
}

function duplicateKeyFor(error, field) {
  if (error?.code !== 11000) return false;
  const pattern = Object.keys(error.keyPattern || {});
  const keys = pattern.length ? pattern : Object.keys(error.keyValue || {});
  return keys.length === 1 && keys[0] === field;
}

async function allocateContractRequestNumber(Contract, Counter, year = requestNumberYear()) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) throw new Error("Invalid request-number year.");
  const counterId = `contract_${year}`;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const highest = await Contract.aggregate([
      { $match: { requestNumber: { $regex: `^LB-${year}-[0-9]+$` } } },
      { $project: { sequence: { $convert: { input: { $arrayElemAt: [{ $split: ["$requestNumber", "-"] }, 2] }, to: "double", onError: null, onNull: null } } } },
      { $group: { _id: null, sequence: { $max: "$sequence" } } },
    ]);
    const floor = Number(highest[0]?.sequence ?? 0);
    if (!Number.isSafeInteger(floor) || floor < 0 || floor >= Number.MAX_SAFE_INTEGER) throw new Error("Request-number sequence exceeds the supported range.");
    try {
      await Counter.findByIdAndUpdate(counterId, { $max: { seq: floor } }, { new: true, upsert: true, setDefaultsOnInsert: false });
    } catch (error) {
      // Two first submissions may race to create the same counter document.
      if (duplicateKeyFor(error, "_id") && attempt < MAX_ATTEMPTS - 1) continue;
      throw error;
    }
    const counter = await Counter.findByIdAndUpdate(counterId, { $inc: { seq: 1 } }, { new: true });
    if (!counter) continue;
    if (!Number.isSafeInteger(counter.seq) || counter.seq < 1) throw new Error("Invalid request-number counter.");
    return `LB-${year}-${String(counter.seq).padStart(4, "0")}`;
  }
  const error = new Error("A request number could not be allocated. Please try again later.");
  error.statusCode = 503;
  throw error;
}

async function saveContractWithRequestNumberRetry(contract) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      await contract.save();
      return contract;
    } catch (error) {
      if (!duplicateKeyFor(error, "requestNumber") || contract.isNew === false) throw error;
      if (attempt === MAX_ATTEMPTS - 1) {
        const unavailable = new Error("A unique request number could not be allocated. Please try again later.");
        unavailable.statusCode = 503;
        throw unavailable;
      }
      // The pre-save hook reconciles the counter and allocates a fresh number.
      contract.requestNumber = undefined;
    }
  }
}

module.exports = { allocateContractRequestNumber, saveContractWithRequestNumberRetry, requestNumberYear };
