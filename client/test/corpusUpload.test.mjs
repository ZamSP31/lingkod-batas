import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

async function dropzone(props) {
  const changes = [];
  const jsx = (type, props) => ({ type, props });
  const deps = {
    react: { useRef: value => ({ current: value }), useState: value => [value, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "./icons.js": { FileIcon() {}, XIcon() {} },
    "../../utils/format.js": { formatFileSize: String },
  };
  const file = "../src/components/attorney/FileDropzone.tsx";
  const { code } = await transformWithOxc(await fs.readFile(new URL(file, import.meta.url), "utf8"), file);
  const script = code.replace(/^import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/gm, (_, names, name) => {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`);
    return `const ${names.replace(/\bas\b/g, ":")} = __deps[${JSON.stringify(name)}];`;
  }).replace(/^export default \w+;?/gm, "");
  const context = vm.createContext({ __deps: deps });
  vm.runInContext(script + "\nthis.component = FileDropzone;", context);
  const tree = context.component({ file: null, onFileChange: value => changes.push(value), ...props });
  function find(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "input") return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child); if (result) return result; }
  }
  const input = find(tree);
  return { changes, accept: input.props.accept, pick(candidate) { input.props.onChange({ target: { files: [candidate], value: "" } }); } };
}

test("corpus picker accepts TXT while the default contract picker rejects it", async () => {
  const file = { name: "synthetic.txt", type: "text/plain", size: 40 };
  const corpus = await dropzone({ allowText: true });
  assert.ok(corpus.accept.includes("text/plain")); corpus.pick(file);
  assert.equal(corpus.changes[0], file);
  const contract = await dropzone({});
  assert.ok(!contract.accept.includes("text/plain")); contract.pick(file);
  assert.equal(contract.changes[0], null);
});
test("corpus picker retains the 20MB limit and rejects unsupported types", async () => {
  const corpus = await dropzone({ allowText: true });
  corpus.pick({ name: "oversized.pdf", type: "application/pdf", size: 20 * 1024 * 1024 + 1 });
  corpus.pick({ name: "unsafe.html", type: "text/html", size: 100 });
  assert.deepEqual(corpus.changes, [null, null]);
});
