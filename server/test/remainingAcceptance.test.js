const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const express = require("express");
const { createHarness, fixture } = require("./helpers/isolatedHarness");
function load(file, deps) {
  const context = { module: { exports: {} }, console: { log() {}, error() {}, warn() {} }, require(name) {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`); return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"), context);
  return context.module.exports;
}
const source = { _id: "000000000000000000000001", title: "Synthetic overtime", citation: "Synthetic Article 87", provisionText: "Synthetic overtime provision.", tags: ["working_hours_overtime"] };
async function analyze(type, clause, rows = [source]) {
  let committed;
  const service = load("services/ragService.js", {
    "../models/StatutorySource": { find() { const q = { sort() { return q; }, limit() { return q; }, then(yes, no) { return Promise.resolve(rows).then(yes, no); } }; return q; } },
    "../models/Contract": { findById: async () => ({ _id: "synthetic", contractType: type, rawOcrText: clause.clauseText }) }, "../models/ContractFlag": {},
    "./clauseSegmenter": { ...require("../src/services/clauseSegmenter"), segmentContractText: () => [clause] },
    "./auditService": { logAction: async () => {} }, "./notificationService": { createNotification: async () => {}, notifyAttorneys: async () => {} },
  });
  await service.analyzeContract("synthetic", { commitAnalysis: async (flags, fields) => { committed = { flags, fields }; } }); return committed;
}
test("four selected types reach persisted screening context without changing general-rule risk", async () => {
  for (const type of ["regular", "probationary", "project_based", "fixed_term"]) {
    const result = await analyze(type, { clauseText: "Overtime is mandatory without additional compensation.", clauseIndex: 0, category: "working_hours_overtime" });
    assert.equal(result.flags[0].clientSelectedContractType, type); assert.equal(result.flags[0].screeningScope, "general_employment");
    assert.equal(result.flags[0].screeningRule, "overtime_compensation"); assert.equal(result.flags[0].aiRiskLevel, "medium");
  }
});
test("type-specific clauses remain unassessed without a supported implemented rule", async () => {
  const probation = { ...source, title: "Synthetic probationary employment", citation: "Synthetic Article 296", provisionText: "Synthetic probationary employment provision." };
  const result = await analyze("probationary", { clauseText: "The probationary period lasts twelve months.", clauseIndex: 0, category: "probationary_period" }, [probation]);
  assert.equal(result.flags[0].assessmentState, "insufficient_evidence"); assert.equal(result.flags[0].evidenceReason, "unsupported_rule");
  assert.equal(result.flags[0].screeningScope, "type_specific_unassessed"); assert.equal(result.fields.aiRiskLevel, null);
});
async function ask(message, rows) {
  const controller = load("controllers/chatbotController.js", { "express-async-handler": fn => fn,
    "../utils/chatbotScope": require("../src/utils/chatbotScope"), "../models/StatutorySource": { find: () => ({ sort() { return this; }, limit: async () => rows }) } });
  const res = { status() { return this; }, json(value) { this.body = value; } };
  await controller.handleChatbotMessage({ body: { message } }, res); return res.body;
}
test("sourced legal answers include an explicit informational disclaimer", async () => {
  const answer = await ask("What is overtime?", [source]);
  assert.match(answer.disclaimer, /General information only.*not legal advice/); assert.ok(answer.reply.endsWith(answer.disclaimer));
  assert.match((await ask("Supported contract types", [])).disclaimer, /not legal advice/);
});
test("broad topic matches cannot answer missing rates, exceptions, calculations, durations or holiday coverage", async () => {
  for (const question of ["What is the overtime rate?", "What overtime exceptions apply?", "How do I calculate overtime?", "What about overtime on holidays?"]) {
    assert.equal((await ask(question, [source])).scope, "insufficient_evidence", question);
  }
  const probation = { ...source, title: "Synthetic probationary employment", provisionText: "Synthetic probationary employment provision." };
  assert.equal((await ask("Gaano katagal ang probasyon?", [probation])).scope, "insufficient_evidence");
  assert.ok((await ask("Gaano katagal ang probasyon?", [{ ...probation, provisionText: "Synthetic probationary duration: six months." }])).source);
  assert.ok((await ask("What is the overtime rate?", [{ ...source, provisionText: "Synthetic overtime rate: 25 percent." }])).source);
});
async function start(app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  return { url: `http://127.0.0.1:${server.address().port}`, async stop() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
test("MR06 actual HTTP completion route blocks excluded pending low-risk clauses", async () => {
  const h = createHarness({ contracts: [fixture()], flags: [{ _id: "flag-a", contractId: "contract-a", aiRiskLevel: "low", attorneyStatus: "pending", includedInReport: false }] });
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { _id: "attorney-a", role: "attorney" }; next(); });
  app.use("/api/attorney", h.load("routes/attorneyRoutes.js", { express,
    "../controllers/attorneyController": h.load("controllers/attorneyController.js"),
    "../middleware/auth": { protect: (_req, _res, next) => next(), authorize: () => (_req, _res, next) => next() },
  })); app.use(require("../src/middleware/errorHandler").errorHandler);
  const server = await start(app);
  try {
    const response = await fetch(`${server.url}/api/attorney/contracts/contract-a/complete`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ releaseReport: true }) });
    assert.equal(response.status, 409); assert.equal(h.contracts[0].reportReleasedToClient, false);
  } finally { await server.stop(); }
});
test("HTTP password success persists a valid audit event without credentials; failure logs no success", async () => {
  const entries = []; const SchemaModel = require("../src/models/AuditLog");
  function AuditModel(values) { const doc = new SchemaModel(values); doc.save = async () => { const error = doc.validateSync(); if (error) throw error; entries.push(doc.toObject()); return doc; }; return doc; }
  const audit = load("services/auditService.js", { "../models/AuditLog": AuditModel });
  const user = { id: "000000000000000000000001", _id: "000000000000000000000001", fullName: "Synthetic Client", email: "synthetic@example.invalid", role: "client" };
  const controller = load("controllers/authController.js", { "express-async-handler": require("express-async-handler"), "express-validator": {}, "../services/authSecurity": {}, "../services/auditService": audit,
    "../services/authService": { updateProfile: async (_id, values) => {
      if (values.currentPassword !== "SyntheticCurrent!123") { const error = new Error("Invalid current password"); error.statusCode = 403; throw error; } return user;
    } } });
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = user; next(); });
  app.put("/api/auth/profile", controller.updateProfile); app.use(require("../src/middleware/errorHandler").errorHandler);
  const server = await start(app);
  try {
    for (const [password, status] of [["SyntheticCurrent!123", 200], ["wrong", 403]]) {
      const response = await fetch(`${server.url}/api/auth/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: password, newPassword: "SyntheticReplacement!123" }) }); assert.equal(response.status, status);
    }
    assert.equal(entries.length, 1); assert.equal(entries[0].action, "USER_PROFILE_UPDATE"); assert.equal(entries[0].details.passwordChanged, true);
    assert.ok(!JSON.stringify(entries).includes("SyntheticCurrent")); assert.ok(!JSON.stringify(entries).includes("SyntheticReplacement"));
  } finally { await server.stop(); }
});
