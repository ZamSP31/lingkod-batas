import test from "node:test";
import assert from "node:assert/strict";
import { hooks, load, nodes } from "./helpers/componentHarness.mjs";

test("transcription requires original-document confirmation, prevents duplicate saves and retains text after failure", async () => {
  const h = hooks(); const calls = []; let finish;
  const Component = await load(new URL("../src/components/attorney/ManualTranscriptionForm.tsx", import.meta.url), "ManualTranscriptionForm", { react: h.react });
  h.mount(() => Component({ onSave: text => { calls.push(text); return new Promise((resolve, reject) => { finish = { resolve, reject }; }); } }));
  const form = () => nodes(h.tree, node => node.type === "form")[0];
  const textarea = () => nodes(h.tree, node => node.type === "textarea")[0];
  const checkbox = () => nodes(h.tree, node => node.type === "input")[0];
  const submit = () => form().props.onSubmit({ preventDefault() {} });
  textarea().props.onChange({ target: { value: "1. No overtime pay." } }); await h.flush();
  await submit(); assert.equal(calls.length, 0);
  checkbox().props.onChange({ target: { checked: true } }); await h.flush();
  const pending = submit(); await submit(); assert.equal(calls.length, 1);
  finish.reject(new Error("Synthetic save failed")); await pending; await h.flush();
  assert.equal(textarea().props.value, "1. No overtime pay.");
  assert.equal(nodes(h.tree, node => node.props?.role === "alert")[0].props.children, "Synthetic save failed");
  const retry = submit(); finish.resolve(); await retry; await h.flush();
  assert.equal(calls.length, 2);
  textarea().props.onChange({ target: { value: "Changed transcription" } }); await h.flush();
  assert.equal(checkbox().props.checked, false);
});

test("reserved processing rows cannot open review before the document is ready", async () => {
  const opened = [];
  const Component = await load(new URL("../src/components/attorney/ContractsTable.tsx", import.meta.url), "ContractsTable", {
    "../../utils/format.js": { formatHighRiskCount: String, formatShortDate: String },
  });
  for (const status of ["ocr-processing", "ai-analysis", "awaiting-review"]) {
    const tree = Component({ contracts: [{ id: "synthetic", title: "Synthetic", status, uploadedAt: "2026-10-31", highRiskFlagCount: 0 }],
      onOpenContract: id => opened.push(id) });
    const action = nodes(tree, node => node.type === "button")[0];
    const row = nodes(tree, node => node.type === "tr" && node.props.onClick)[0];
    row.props.onClick();
    assert.equal(action.props.disabled, status !== "awaiting-review");
  }
  assert.deepEqual(opened, ["synthetic"]);
});

for (const role of ["client", "attorney"]) {
  test(`${role} dashboard reports API failure and retries without replacing loaded contracts`, async () => {
    const h = hooks(); let fails = true; let requests = 0;
    const contracts = [{ id: "synthetic", title: "Synthetic contract", requestNumber: "SYNTHETIC-001", uploadedAt: "2026-10-31", status: "awaiting-review", highRiskFlagCount: 0 }];
    const getContracts = async () => { requests++; if (fails) throw new Error("Synthetic outage"); return contracts; };
    const name = role === "client" ? "ClientDashboardPage" : "AttorneyDashboardPage";
    const Component = await load(new URL(`../src/pages/${role}/${name}.tsx`, import.meta.url), name, {
      react: h.react, "react-router-dom": { useNavigate: () => () => {} },
      "../../context/AuthContext.js": { useAuth: () => ({ token: "synthetic" }) },
      "../../services/contractService.js": { getClientContracts: getContracts },
      "../../services/attorneyService.js": { getAttorneyQueue: getContracts },
      "../../services/notificationService.js": { getNotifications: async () => ({ notifications: [] }) },
      "../../types/contract.js": { REVIEW_COMPLETE_STATUSES: ["approved"] },
    }, { window: { setInterval() { return 1; }, clearInterval() {}, addEventListener() {}, removeEventListener() {} } });
    h.mount(Component); await h.flush();
    assert.equal(nodes(h.tree, node => node.props?.role === "alert").length, 1);
    assert.equal(nodes(h.tree, node => node.props?.onTrackContract || node.props?.onOpenContract).length, 0);
    const retry = nodes(h.tree, node => node.type === "button" && node.props.children === "Retry")[0].props.onClick;
    fails = false; retry(); await h.flush();
    assert.equal(nodes(h.tree, node => node.props?.role === "alert").length, 0);
    assert.equal(nodes(h.tree, node => node.props?.contracts?.[0]?.id === "synthetic").length, 1);
    fails = true; retry(); await h.flush();
    assert.equal(nodes(h.tree, node => node.props?.role === "alert").length, 1);
    assert.equal(nodes(h.tree, node => node.props?.contracts?.[0]?.id === "synthetic").length, 1);
    assert.equal(requests, 3); h.dispose();
  });
}
