import fs from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

export const element = (type, props) => ({ type, props });
export function nodes(tree, predicate) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
export function hooks() {
  const slots = []; let cursor = 0; let effects = []; let dirty = false; let component; let tree;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === "function" ? value(slots[index]) : value;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo: operation => operation(),
    useEffect(operation, dependencies) {
      const index = cursor++; const old = slots[index];
      if (!old || !dependencies || dependencies.some((value, offset) => !Object.is(value, old.dependencies[offset]))) {
        slots[index] = { dependencies, cleanup: old?.cleanup };
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = operation(); });
      }
    },
  };
  return { react, get tree() { return tree; }, mount(fn) { component = fn; this.render(); },
    render() { cursor = 0; dirty = false; tree = component(); const pending = effects; effects = []; pending.forEach(fn => fn()); },
    async flush() { for (let i = 0; i < 12; i++) { await new Promise(resolve => setImmediate(resolve)); if (dirty) this.render(); } },
    dispose() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}
export async function load(file, name, overrides = {}, globals = {}) {
  const source = await fs.readFile(file, "utf8");
  const deps = {};
  for (const match of source.matchAll(/import[\s\S]*?from\s+["']([^"']+)["'];/g)) deps[match[1]] = { default: "MockComponent" };
  Object.assign(deps, overrides);
  deps["react/jsx-runtime"] = { jsx: element, jsxs: element };
  const { code } = await transformWithOxc(source, String(file));
  const script = code.replace(/^import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/gm, (_, names, dependency) => {
    if (!(dependency in deps)) throw new Error(`ISOLATION VIOLATION: ${dependency}`);
    const binding = names.startsWith("{") ? names.replace(/\bas\b/g, ":") : `{default: ${names}}`;
    return `const ${binding} = __deps[${JSON.stringify(dependency)}];`;
  }).replace(/^export default function /gm, "function ").replace(/^export default \w+;?/gm, "").replace(/^export /gm, "");
  const context = vm.createContext({ __deps: deps, Error, ...globals });
  vm.runInContext(script + `\nthis.component = ${name};`, context);
  return context.component;
}
