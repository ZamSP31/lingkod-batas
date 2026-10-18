import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithOxc } from 'vite';

// Exercise actual component handlers with synthetic hook state and mocked HTTP.
// This does not simulate browser layout or a real MongoDB connection.
const element = (type, props) => ({ type, props });
function hooks() {
  const slots = []; let cursor = 0; let effects = []; let dirty = false;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }];
    },
    useEffect(fn, deps) {
      const i = cursor++; const old = slots[i];
      if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) {
        slots[i] = { deps, cleanup: old?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  let component; let tree;
  return { react, get tree() { return tree; },
    mount(fn) { component = fn; this.render(); },
    render() { cursor = 0; dirty = false; tree = component(); const pending = effects; effects = []; pending.forEach(fn => fn()); },
    async flush() { for (let i = 0; i < 12; i++) { await new Promise(resolve => setImmediate(resolve)); if (dirty) this.render(); } },
    dispose() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}
async function load(file, result, deps, globals = {}) {
  const { code } = await transformWithOxc(await fs.readFile(new URL(file, import.meta.url), 'utf8'), file);
  const script = code.replace(/^import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/gm, (_, names, path) => {
    if (!(path in deps)) throw Error(`ISOLATION VIOLATION: ${path}`);
    const binding = names.startsWith('{') ? names.replace(/\bas\b/g, ':') : `{default: ${names}}`;
    return `const ${binding} = __deps[${JSON.stringify(path)}];`;
  }).replace(/^export default \w+;?/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({ __deps: deps, AbortController, Error, ...globals });
  vm.runInContext(script + `\nthis.result = ${result};`, context);
  return context.result;
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const user = { id: 'synthetic', fullName: 'Saved Synthetic', email: 'synthetic@example.invalid', role: 'client', notificationSettings: { emailNotifications: true, inAppNotifications: true } };
class AuthApiError extends Error { constructor(status) { super('Synthetic error'); this.status = status; } }
async function provider(getUserProfile, updateUserProfile = async () => ({ user })) {
  const h = hooks(); const storage = new Map([['lb_token', 'synthetic-token'], ['lb_user', JSON.stringify(user)]]);
  const Component = await load('../src/context/AuthContext.tsx', 'AuthProvider', {
    react: h.react, 'react/jsx-runtime': { jsx: element, jsxs: element },
    '../services/authService.js': { getUserProfile, updateUserProfile, AuthApiError },
  }, { localStorage: { getItem: key => storage.get(key), setItem: (key, val) => storage.set(key, val), removeItem: key => storage.delete(key) } });
  h.mount(() => Component({ children: 'synthetic child' }));
  return { h, storage, get value() { return h.tree.props.value; } };
}

test('reload replaces cached identity with the profile returned by the backend', async () => {
  const p = await provider(async () => ({ user: { ...user, fullName: 'Fresh Synthetic' } }));
  assert.equal(p.value.isLoading, true);
  await p.h.flush();
  assert.equal(p.value.user.fullName, 'Fresh Synthetic');
  assert.equal(JSON.parse(p.storage.get('lb_user')).fullName, 'Fresh Synthetic');
  assert.equal(p.value.isLoading, false); p.h.dispose();
});
test('expired session clears storage; network failure offers retry without presenting stale details', async () => {
  const expired = await provider(async () => { throw new AuthApiError(401); });
  await expired.h.flush(); assert.equal(expired.value.user, null); assert.equal(expired.storage.has('lb_token'), false); expired.h.dispose();
  let fail = true;
  const offline = await provider(async () => { if (fail) throw Error('offline'); return { user: { ...user, fullName: 'Recovered Synthetic' } }; });
  await offline.h.flush(); assert.equal(nodes(offline.h.tree, node => node.props?.role === 'alert').length, 1);
  assert.equal(offline.storage.has('lb_token'), true);
  fail = false;
  nodes(offline.h.tree, node => node.type === 'button')[0].props.onClick();
  await offline.h.flush(); assert.equal(offline.value.user.fullName, 'Recovered Synthetic'); offline.h.dispose();
});
test('overlapping profile saves are rejected and a late response cannot restore a signed-out session', async () => {
  let finish;
  const p = await provider(async () => ({ user }), () => new Promise(resolve => { finish = resolve; }));
  await p.h.flush();
  const saving = p.value.updateProfile({ firstName: 'Changed' });
  await assert.rejects(p.value.updateProfile({ firstName: 'Other' }), /already being saved/);
  p.value.logout(); finish({ user: { ...user, fullName: 'Changed' } });
  await assert.rejects(saving, /session changed/);
  await p.h.flush(); assert.equal(p.value.user, null); p.h.dispose();
});
for (const role of ['client', 'attorney']) {
  test(`${role}: notification saves send only one preference, block overlap and show failures`, async () => {
    const file = `../src/pages/${role}/${role === 'client' ? 'Client' : 'Attorney'}AccountPage.tsx`;
    const source = await fs.readFile(new URL(file, import.meta.url), 'utf8');
    // Map only imported dependencies. Components remain plain elements; no external services run.
    const deps = {};
    for (const match of source.matchAll(/import[\s\S]*?from\s+["']([^"']+)["'];/g)) deps[match[1]] = { default: 'MockComponent' };
    const h = hooks(); let finish; let saved; const calls = [];
    deps.react = h.react;
    deps['react/jsx-runtime'] = { jsx: element, jsxs: element };
    deps['react-router-dom'] = { useNavigate: () => () => {} };
    deps['../../context/AuthContext.js'] = { useAuth: () => ({ user, updateProfile: payload => { calls.push(payload); return new Promise((resolve, reject) => { finish = { resolve, reject }; }); } }) };
    const Component = await load(file, role === 'client' ? 'ClientAccountPage' : 'AttorneyAccountPage', deps);
    h.mount(Component); await h.flush();
    nodes(h.tree, node => node.props?.name === 'firstName')[0].props.onChange({ target: { value: 'Unsaved' } });
    await h.flush();
    const switches = () => nodes(h.tree, node => node.props?.onChange && typeof node.props.checked === 'boolean');
    saved = switches()[0].props.onChange(false);
    await switches()[1].props.onChange(false);
    assert.equal(calls.length, 1);
    assert.equal(JSON.stringify(calls[0]), '{"notificationSettings":{"emailNotifications":false}}');
    assert.equal(switches()[0].props.checked, true);
    finish.reject(Error('Synthetic save failure')); await saved; await h.flush();
    assert.equal(switches()[0].props.checked, true);
    assert.equal(nodes(h.tree, node => node.props?.children === 'Synthetic save failure').length, 1);
    user.notificationSettings = { emailNotifications: false, inAppNotifications: true };
    h.render(); await h.flush();
    assert.equal(nodes(h.tree, node => node.props?.name === 'firstName')[0].props.value, 'Unsaved');
    assert.equal(switches()[0].props.checked, false);
    user.notificationSettings = { emailNotifications: true, inAppNotifications: true };
    h.dispose();
  });
}


test('HTTP service serializes sparse preference updates and reads profiles without caching', async () => {
  const calls = [];
  const service = await load('../src/services/authService.ts', '({updateUserProfile, getUserProfile})', {
    './apiConfig.js': { BASE_URL: 'https://synthetic.example.invalid' },
  }, { fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ user, sessionRevoked: false }) }; } });
  await service.updateUserProfile({ notificationSettings: { emailNotifications: false } }, 'synthetic-token');
  assert.equal(calls[0].options.body, '{"notificationSettings":{"emailNotifications":false}}');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer synthetic-token');
  await service.updateUserProfile({ firstName: ' Fresh ', lastName: ' Synthetic ' }, 'synthetic-token');
  assert.equal(JSON.parse(calls[1].options.body).fullName, 'Fresh Synthetic');
  await service.getUserProfile('synthetic-token');
  assert.equal(calls[2].options.cache, 'no-store');
  assert.equal(calls[2].url, 'https://synthetic.example.invalid/api/auth/profile');
});

test('attorney navigation uses the saved identity and roll number without sample replacements', async () => {
  const h = hooks();
  const Component = await load('../src/components/layout/AttorneyShell.tsx', 'AttorneyShell', {
    react: h.react, 'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-router-dom': { Outlet: 'Outlet', useNavigate: () => () => {} },
    './AttorneySidebar.js': { default: 'AttorneySidebar' },
    '../shared/NotificationsMenu.js': { default: 'NotificationsMenu' },
    '../client/ChatbotWidget.js': { default: 'Chatbot' },
    '../../context/AuthContext.js': { useAuth: () => ({ user: { ...user, fullName: 'Juan Dela Cruz', role: 'attorney', rollNumber: 'synthetic-roll' }, isLoading: false }) },
  });
  h.mount(Component);
  const profile = nodes(h.tree, node => node.type === 'AttorneySidebar')[0].props.attorney;
  assert.equal(profile.fullName, 'Juan Dela Cruz');
  assert.equal(profile.rollNumber, 'synthetic-roll');
  assert.equal(profile.initials, 'JD'); h.dispose();
});
