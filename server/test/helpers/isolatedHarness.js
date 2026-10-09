const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const sourceRoot = path.resolve(__dirname, '../../src');
const permittedSources = new Set([
  'controllers/contractController.js', 'controllers/attorneyController.js',
  'middleware/auth.js', 'routes/attorneyRoutes.js', 'routes/contractRoutes.js',
]);

function fixture(overrides = {}) {
  return { _id: 'contract-a', clientId: { _id: 'client-a' },
    assignedAttorneyId: 'attorney-a', requestNumber: 'SYNTHETIC-001',
    title: 'Synthetic employment contract', status: 'under_review',
    reportReleasedToClient: false, rawOcrText: 'SYNTHETIC ONLY',
    aiRiskLevel: 'high', attorneyNotes: 'INTERNAL SYNTHETIC NOTE',
    cloudinaryUrl: 'https://example.invalid/synthetic', cloudinaryPublicId: 'synthetic-only',
    ...overrides };
}

function createHarness({ contracts = [fixture()], flags = [], users = [] } = {}) {
  // Synthetic populated references also support the unpopulated ObjectId's
  // toString behavior used by the status controller.
  contracts.forEach((row) => {
    if (row.clientId && typeof row.clientId === 'object') {
      Object.defineProperty(row.clientId, 'toString', { enumerable: false, value: () => String(row.clientId._id) });
    }
  });
  const calls = [];
  const violations = [];
  const deny = (name) => { violations.push(name); throw new Error(`ISOLATION VIOLATION: ${name}`); };
  const asyncHandler = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(next);
  function query(value) {
    let projection;
    const q = {
      sort() { return q; }, populate() { return q; },
      select(fields) { projection = fields; return q; },
      then(resolve, reject) {
        function project(row) {
          if (!row || !projection) return row;
          if (projection.startsWith('-')) {
            const copy = { ...row };
            projection.split(/\s+/).forEach((key) => delete copy[key.slice(1)]);
            return copy;
          }
          return Object.fromEntries(['_id', ...projection.split(/\s+/)]
            .filter((key) => key in row).map((key) => [key, row[key]]));
        }
        return Promise.resolve(Array.isArray(value) ? value.map(project) : project(value)).then(resolve, reject);
      },
    };
    return q;
  }
  const id = (value) => String(value?._id ?? value);
  function model(name, rows) {
    rows.forEach((row) => {
      Object.defineProperty(row, 'save', { enumerable: false, value: async () => {
        calls.push({ name: `${name}.save`, id: row._id }); return row;
      } });
    });
    return {
      findById(key) { calls.push({ name: `${name}.findById`, key }); return query(rows.find((row) => id(row) === id(key)) ?? null); },
      find(filter) {
        calls.push({ name: `${name}.find`, filter });
        return query(rows.filter((row) => Object.entries(filter).every(([key, value]) => id(row[key]) === id(value))));
      },
    };
  }
  const modules = {
    'express-async-handler': asyncHandler,
    '../models/Contract': model('Contract', contracts),
    '../models/ContractFlag': model('ContractFlag', flags),
    '../models/User': model('User', users),
    '../services/cloudinaryService': { uploadToCloudinary: () => deny('Cloudinary upload'), deleteFromCloudinary: () => deny('Cloudinary deletion') },
    '../services/ocrService': { processContract: () => deny('OCR') },
    '../services/ragService': { analyzeContract: () => deny('AI assessment') },
    '../services/emailService': new Proxy({}, { get: () => () => deny('email') }),
    '../services/auditService': { logAction: async (event) => calls.push({ name: 'audit', event }) },
    '../services/notificationService': {
      createNotification: async (event) => calls.push({ name: 'notification', event }),
      notifyAttorneys: async (event) => calls.push({ name: 'notification', event }),
    },
    '../utils/fileValidation': { isValidDocumentBuffer: () => deny('unapproved upload path') },
    jsonwebtoken: { verify(token) {
      if (token === 'expired' || token !== 'synthetic-token') throw new Error('Invalid synthetic token');
      return { id: 'client-a' };
    } },
  };
  function dependency(name, dependencies = modules) {
    if (!Object.hasOwn(dependencies, name)) return deny(`unmocked dependency ${name}`);
    return dependencies[name];
  }
  function load(relative, additions = {}) {
    assert.ok(permittedSources.has(relative), 'Only reviewed source modules may be evaluated');
    const dependencies = { ...modules, ...additions };
    const module = { exports: {} };
    const context = vm.createContext({
      module, exports: module.exports,
      require(name) { return dependency(name, dependencies); },
      process: Object.freeze({ env: Object.freeze({ JWT_SECRET: 'synthetic-test-secret' }) }),
      fetch: () => deny('fetch'), setImmediate: () => deny('background task'),
      setTimeout: () => deny('timer'), console: { log() {}, warn() {}, error() {} },
    }, { codeGeneration: { strings: false, wasm: false } });
    new vm.Script(fs.readFileSync(path.join(sourceRoot, relative), 'utf8'),
      { filename: relative }).runInContext(context, { timeout: 1000 });
    return module.exports;
  }
  async function invoke(handler, overrides = {}) {
    const req = { user: { _id: 'client-a', role: 'client' }, params: { id: 'contract-a' }, body: {}, query: {}, headers: {}, ...overrides };
    const res = { statusCode: 200, payload: undefined, status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = JSON.parse(JSON.stringify(payload)); return this; } };
    let error; let nextCalled = false;
    await handler(req, res, (err) => { error = err; nextCalled = true; });
    assert.equal(violations.length, 0, `Unexpected service access: ${violations.join(', ')}`);
    return { ...res, error, nextCalled, req };
  }
  return { load, invoke, calls, violations, deny, dependency, contracts, flags };
}

// TODO tests execute genuine desired-behavior assertions and are reported
// separately by Node. They are not evidence of passing protections.
function knownDefect(test, name, body) {
  test(`KNOWN DEFECT: ${name}`, { todo: 'Unfixed regression target; not a passing protection' }, body);
}

module.exports = { createHarness, fixture, knownDefect };
