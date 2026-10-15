const { randomUUID } = require("node:crypto");

const STAGES = ["pending", "ocr_processing", "ai_analysis"];
const LEASE_MS = 120000;
const MAX_ATTEMPTS = 3;

// Dependencies are injectable so restart/race tests never use live integrations.
function createProcessingWorker({ Contract, ContractFlag, downloadContract, processContract,
  analyzeContract, now = () => new Date(), logger = console, attemptTimeoutMs = 600000 }) {
  let stopped = false;
  let running = false;
  let timer;

  async function runOnce() {
    if (stopped || running) return;
    running = true;
    let contract;
    let heartbeat;
    let deadline;
    const controller = new AbortController();
    try {
      const token = randomUUID();
      const time = now();
      contract = await Contract.findOneAndUpdate({
        status: { $in: STAGES },
        reportReleasedToClient: { $ne: true },
        $and: [
          { $or: [{ processingLeaseUntil: null }, { processingLeaseUntil: { $lte: time } }] },
          { $or: [{ processingNextAttemptAt: null }, { processingNextAttemptAt: { $lte: time } }] },
        ],
      }, {
        $set: { processingToken: token, processingLeaseUntil: new Date(time.getTime() + LEASE_MS) },
        $inc: { processingAttempts: 1 },
      }, { new: true, sort: { createdAt: 1 } })
        .select("+processingToken +processingLeaseUntil +processingAttempts");
      if (!contract) return;
      const owned = () => ({ _id: contract._id, processingToken: token,
        processingLeaseUntil: { $gt: now() }, status: { $in: STAGES },
        reportReleasedToClient: { $ne: true } });
      const update = async (fields) => {
        const result = await Contract.findOneAndUpdate(owned(), { $set: fields }, { new: true });
        if (!result) throw new Error("Processing lease lost");
        return result;
      };
      heartbeat = setInterval(() => {
        update({ processingLeaseUntil: new Date(now().getTime() + LEASE_MS) }).catch(() => {});
      }, LEASE_MS / 3);
      heartbeat.unref();
      const commitAnalysis = async (flags, fields) => {
        const session = await Contract.startSession();
        try {
          await session.withTransaction(async () => {
            const result = await Contract.findOneAndUpdate(owned(), { $set: fields }, { new: true, session });
            if (!result) throw new Error("Processing lease lost");
            // Never overwrite a human decision, even on legacy interrupted jobs.
            if (await ContractFlag.exists({ contractId: contract._id, attorneyStatus: { $ne: "pending" } }).session(session)) {
              throw new Error("Existing attorney decisions require manual review");
            }
            await ContractFlag.deleteMany({ contractId: contract._id, attorneyStatus: "pending" }, { session });
            if (flags.length) await ContractFlag.insertMany(flags, { session });
          });
        } finally {
          await session.endSession();
        }
      };
      if (contract.processingAttempts > MAX_ATTEMPTS) throw new Error("Processing attempts exhausted");
      const job = { update, commitAnalysis, signal: controller.signal };
      await Promise.race([
        (async () => {
          if (contract.status !== "ai_analysis") {
            await update({ status: "ocr_processing" });
            const { buffer, mimeType } = await downloadContract(contract, { signal: controller.signal });
            await processContract(contract._id, buffer, mimeType, job);
          }
          const current = await Contract.findById(contract._id);
          if (current?.status === "ai_analysis") await analyzeContract(contract._id, job);
        })(),
        new Promise((_, reject) => {
          deadline = setTimeout(() => { controller.abort(); reject(new Error("Processing attempt timed out")); }, attemptTimeoutMs);
        }),
      ]);
      // Terminal stages cannot be claimed again. Clear only our own lease.
      await Contract.updateOne({ _id: contract._id, processingToken: token }, {
        $set: { processingToken: null, processingLeaseUntil: null, processingNextAttemptAt: null },
      });
    } catch (error) {
      if (contract) {
        const exhausted = contract.processingAttempts >= MAX_ATTEMPTS;
        await Contract.updateOne({ _id: contract._id, processingToken: contract.processingToken,
          processingLeaseUntil: { $gt: now() }, status: { $in: STAGES }, reportReleasedToClient: { $ne: true } }, {
          $set: {
            processingToken: null, processingLeaseUntil: null,
            processingNextAttemptAt: exhausted ? null : new Date(now().getTime() + 30000 * contract.processingAttempts),
            ...(exhausted ? { status: "awaiting_attorney_review", flaggedForManualReview: true,
              attorneyNotes: "Automatic document processing could not finish after repeated attempts. Manual review is required." } : {}),
          },
        }).catch(() => {});
      }
      // Do not log contract text, storage URLs, credentials, or integration errors.
      logger.error("[processingWorker] Processing attempt failed; recovery remains persisted.");
    } finally {
      controller.abort();
      clearInterval(heartbeat);
      clearTimeout(deadline);
      running = false;
    }
  }

  return {
    runOnce,
    start() {
      if (timer || stopped) return;
      timer = setInterval(() => { void runOnce(); }, 5000);
      timer.unref();
      void runOnce();
    },
    stop() { stopped = true; clearInterval(timer); },
  };
}

function startProcessingWorker() {
  const worker = createProcessingWorker({
    Contract: require("../models/Contract"),
    ContractFlag: require("../models/ContractFlag"),
    downloadContract: require("./cloudinaryService").downloadContract,
    processContract: require("./ocrService").processContract,
    analyzeContract: require("./ragService").analyzeContract,
  });
  worker.start();
  return worker;
}

module.exports = { createProcessingWorker, startProcessingWorker };
