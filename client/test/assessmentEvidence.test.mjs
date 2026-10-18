import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";
const element = (type, props) => typeof type === "function" ? type(props) : ({ type, props });
const runtime = { jsx: element, jsxs: element };
async function load(file, result, deps = {}, globals = {}) {
  const { code } = await transformWithOxc(await fs.readFile(new URL(file, import.meta.url), "utf8"), file);
  const script = code.replace(/^import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/gm, (_, names, name) => {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`);
    const binding = names.startsWith("{") ? names.replace(/\bas\b/g, ":") : `{ default: ${names} }`;
    return `const ${binding} = __deps[${JSON.stringify(name)}];`;
  }).replace(/^export default function /gm, "function ").replace(/^export default \w+;?/gm, "").replace(/^export /gm, "");
  const context = vm.createContext({ __deps: deps, ...globals });
  vm.runInContext(script + `\nthis.result = ${result};`, context);
  return context.result;
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (!tree || typeof tree !== "object") return "";
  return [tree.props?.children].flat(Infinity).map(text).join(" ");
}
const assessment = await load("../src/utils/assessment.ts", "({ evidenceNotice, hasRiskDecision, hasRecordedAssessment, screeningContext, formatContractType })");
const Notice = await load("../src/components/shared/EvidenceNotice.tsx", "EvidenceNotice", {
  "react/jsx-runtime": runtime, "../../utils/assessment.js": assessment,
});
const Card = await load("../src/components/client/RiskClauseCard.tsx", "RiskClauseCard", {
  "react/jsx-runtime": runtime, "../shared/EvidenceNotice.js": { default: Notice }, "../../utils/assessment.js": assessment,
});
const clause = { id: "synthetic", clauseNumber: "1", title: "Synthetic clause", quotedText: "Original synthetic provision.",
  riskLevel: "low", attorneyStatus: "pending", assessmentState: "insufficient_evidence", evidenceReason: "no_matching_sources" };

test("report cards keep unsupported and legacy clauses visibly unassessed", () => {
  const tree = Card({ clause }); const output = text(tree);
  assert.match(output, /Insufficient corpus evidence/); assert.match(output, /Not assessed/);
  assert.doesNotMatch(output, /Statutory Compliant|Complies with|No legal conflicts/);
  const notice = nodes(tree).find(node => text(node).startsWith("Insufficient corpus evidence") && node.type === "p");
  assert.ok(notice); assert.ok(!notice.props.className.includes("print:hidden"));
  const legacy = { ...clause }; delete legacy.assessmentState;
  assert.match(text(Card({ clause: legacy })), /older assessment/);
  assert.equal(assessment.hasRiskDecision(legacy), false);
});
test("attorney findings remain separate from automated evidence limitations", () => {
  const reviewed = { ...clause, attorneyStatus: "overridden", attorneyNote: "Synthetic independent attorney decision." };
  const output = text(Card({ clause: reviewed }));
  assert.match(output, /Attorney decision recorded separately/); assert.match(output, /Counsel: Low Risk/);
  assert.match(output, /Synthetic independent attorney decision/);
  assert.equal(assessment.hasRiskDecision(reviewed), true);
  assert.equal(assessment.evidenceNotice({ ...clause, assessmentState: "assessed" }), null);
});

test("released report summary excludes unassessed clauses from low-risk totals", async () => {
  const report = { contract: { title: "Synthetic report", contractType: "regular", assignedAttorneyId: {}, attorneyNotes: "Synthetic counsel opinion." },
    flags: [{ _id: "synthetic", clauseText: clause.quotedText, clauseIndex: 0, aiRiskLevel: "low", aiRationale: "Synthetic limited assessment.",
      assessmentState: "insufficient_evidence", evidenceReason: "no_matching_sources", attorneyStatus: "approved", statutoryBases: [] }] };
  const states = [report, false, null]; let index = 0;
  const component = await load("../src/pages/client/ContractReportPage.tsx", "ContractReportPage", {
    react: { useState: () => [states[index++], () => {}], useEffect() {} }, "react/jsx-runtime": runtime,
    "react-router-dom": { useParams: () => ({ contractId: "synthetic" }), useSearchParams: () => [new URLSearchParams()], Link: "a" },
    "../../components/client/RiskClauseCard.js": { default: Card }, "../../context/AuthContext.js": { useAuth: () => ({ token: "synthetic", user: {} }) },
    "../../components/shared/ReportSkeleton.js": { default: () => null }, "../../components/shared/CopyButton.js": { default: () => null },
    "../../context/ToastContext.js": { useToast: () => ({ showToast() {} }) }, "../../services/contractService.js": {},
    "../../utils/format.js": { formatShortDate: () => "Synthetic date" }, "../../utils/assessment.js": assessment,
  });
  const output = text(component());
  assert.match(output, /0\s+Low Risk/); assert.match(output, /1\s+provisions have insufficient or unrecorded/);
  assert.match(output, /Insufficient corpus evidence/); assert.doesNotMatch(output, /Statutory Compliant/);
});

test("offline chatbot cannot bypass server scope checks using mock legal replies", async () => {
  const states = []; let index = 0;
  const react = { useState(initial) { const slot = index++; states[slot] ??= slot === 0 ? true : initial;
    return [states[slot], value => { states[slot] = typeof value === "function" ? value(states[slot]) : value; }]; },
    useEffect() {}, useRef: () => ({ current: null }) };
  const component = await load("../src/components/client/ChatbotWidget.tsx", "ChatbotWidget", {
    react, "react/jsx-runtime": runtime,
    "../../mocks/chatbot.js": { INITIAL_CHAT_MESSAGE: { id: "initial", sender: "bot", text: "Synthetic greeting" } },
    "../../services/apiConfig.js": { BASE_URL: "https://example.invalid" },
  }, { fetch: async () => { throw new Error("Synthetic offline"); } });
  const tree = component();
  const button = nodes(tree).find(node => node.type === "button" && text(node).includes("How to upload a contract"));
  assert.ok(button); await button.props.onClick();
  assert.match(states[1].at(-1).text, /temporarily unavailable/);
  assert.doesNotMatch(states[1].at(-1).text, /Labor Code|Article|SUBMIT/);
});

test("readable client-selected types and screening scope remain visible in printable clause context", () => {
  for (const [type, label] of [["regular", "Regular"], ["probationary", "Probationary"], ["project_based", "Project-Based"], ["fixed_term", "Fixed-Term"]]) {
    assert.equal(assessment.formatContractType(type), label);
    const output = text(Notice({ clause: { ...clause, clientSelectedContractType: type, screeningScope: "general_employment", screeningRule: "overtime_compensation" } }));
    assert.ok(output.includes(`Client-selected contract type: ${label}`));
    assert.match(output, /General employment screening only/); assert.match(output, /Overtime compensation/);
  }
  const output = text(Notice({ clause: { ...clause, clientSelectedContractType: "probationary", screeningScope: "type_specific_unassessed" } }));
  assert.match(output, /Type-specific assessment is not supported/);
});

test("chatbot displays the legal disclaimer distinctly without duplicating it in the answer", async () => {
  const states = []; let index = 0;
  const notice = "General information only - not legal advice.";
  const react = { useState(initial) { const slot = index++; if (!(slot in states)) states[slot] = slot === 0 ? true : initial;
    return [states[slot], value => { states[slot] = typeof value === "function" ? value(states[slot]) : value; }]; },
    useEffect() {}, useRef: () => ({ current: null }) };
  const component = await load("../src/components/client/ChatbotWidget.tsx", "ChatbotWidget", {
    react, "react/jsx-runtime": runtime,
    "../../mocks/chatbot.js": { INITIAL_CHAT_MESSAGE: { id: "initial", sender: "bot", text: "Synthetic greeting" } },
    "../../services/apiConfig.js": { BASE_URL: "https://example.invalid" },
  }, { fetch: async () => ({ ok: true, json: async () => ({ reply: `Synthetic sourced response.\n\n${notice}`, disclaimer: notice }) }) });
  const tree = component();
  await nodes(tree).find(node => node.type === "button" && text(node).includes("Salary deduction rules")).props.onClick();
  assert.equal(states[1].at(-1).disclaimer, notice); assert.equal(states[1].at(-1).text, "Synthetic sourced response.");
  index = 0; const rendered = component();
  const paragraphs = nodes(rendered).filter(node => node.type === "p" && text(node) === notice);
  assert.equal(paragraphs.length, 1);
});

test("client dashboard refreshes review activity on timer and focus, then cleans up", async () => {
  const slots = []; let cursor = 0; let effect; let timer; let focus; let cleaned = 0; let requests = 0;
  const notification = { id: "synthetic-review", type: "attorney-reviewing", title: "Review started", read: false };
  const react = { useState(initial) { const index = cursor++; slots[index] = initial; return [initial, value => { slots[index] = value; }]; },
    useMemo: fn => fn(), useEffect: fn => { effect = fn; } };
  const component = await load("../src/pages/client/ClientDashboardPage.tsx", "ClientDashboardPage", {
    react, "react/jsx-runtime": runtime, "react-router-dom": { useNavigate: () => () => {} },
    "../../components/client/ClientContractsTable.js": { default: () => null }, "../../components/client/CompletedReportsPanel.js": { default: () => null },
    "../../components/client/RecentActivityPanel.js": { default: () => null }, "../../components/shared/TableSkeleton.js": { default: () => null },
    "../../context/AuthContext.js": { useAuth: () => ({ token: "synthetic" }) },
    "../../services/contractService.js": { getClientContracts: async () => [] },
    "../../services/notificationService.js": { getNotifications: async () => ({ notifications: ++requests === 1 ? [] : [notification] }) },
    "../../types/contract.js": { REVIEW_COMPLETE_STATUSES: ["approved"] },
  }, { window: { setInterval(fn, delay) { assert.equal(delay, 20000); timer = fn; return 1; }, clearInterval() { cleaned++; },
    addEventListener(name, fn) { assert.equal(name, "focus"); focus = fn; }, removeEventListener(name, fn) { assert.equal(fn, focus); cleaned++; } } });
  component(); const cleanup = effect(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(slots[1].length, 0); await timer(); assert.equal(slots[1][0].id, notification.id);
  await focus(); assert.equal(requests, 3); cleanup(); assert.equal(cleaned, 2);
});
