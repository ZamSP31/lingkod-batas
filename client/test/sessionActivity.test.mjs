import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithOxc } from 'vite';
const source = await fs.readFile(new URL('../src/utils/sessionActivity.ts', import.meta.url), 'utf8');
const { code } = await transformWithOxc(source, 'sessionActivity.ts');
const context = vm.createContext({});
vm.runInContext(code.replace(/^export /gm, '') + '\nthis.watch = watchSessionActivity;', context);
function setup(storage = new Map()) {
  let now = 1000; let expired = 0; let heartbeats = 0; let timer;
  const listeners = new Map();
  const events = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    setInterval: fn => { timer = fn; return 1; }, clearInterval: () => { timer = null; },
  };
  const stop = context.watch({ token: 'synthetic', clock: () => now, events,
    storage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    onExpired: () => { expired++; }, heartbeat: async () => { heartbeats++; },
  });
  return { storage, stop, listeners, get expired() { return expired; }, get heartbeats() { return heartbeats; },
    advance: ms => { now += ms; timer?.(); }, emit: (name, trusted = true) => listeners.get(name)?.({ isTrusted: trusted }),
  };
}
test('idle logout occurs at one hour; timer, focus and polling do not extend activity', () => {
  const h = setup(); h.advance(3599999); h.emit('focus'); assert.equal(h.expired, 0);
  h.advance(1); assert.equal(h.expired, 1); h.advance(1000); assert.equal(h.expired, 1); h.stop();
});
test('trusted interaction extends idle deadline; synthetic interaction cannot keep a session alive', async () => {
  const h = setup(); await new Promise(resolve => setImmediate(resolve)); h.advance(1800000); h.emit('keydown');
  await Promise.resolve(); assert.equal(h.heartbeats, 2);
  h.advance(1800000); assert.equal(h.expired, 0); h.emit('pointermove', false);
  h.advance(1800000); assert.equal(h.expired, 1); h.stop();
});
test('stored expired activity cannot be revived by reload or input; listeners are removed on cleanup', () => {
  const storage = new Map([['lb_session_activity', JSON.stringify({ token: 'synthetic', at: -3600000 })]]);
  const h = setup(storage); assert.equal(h.expired, 1); assert.equal(h.heartbeats, 0);
  h.emit('keydown'); assert.equal(h.expired, 1); h.stop(); assert.equal(h.listeners.size, 0);
});
test('activity from another tab extends the shared deadline', () => {
  const h = setup(); h.advance(1800000);
  h.storage.set('lb_session_activity', JSON.stringify({ token: 'synthetic', at: 1801000 }));
  h.emit('storage'); h.advance(1800000); assert.equal(h.expired, 0);
  h.advance(1800000); assert.equal(h.expired, 1); h.stop();
});
