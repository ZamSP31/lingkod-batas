const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/isolatedHarness');

for (const [label, headers] of [['missing token', {}], ['expired token', { authorization: 'Bearer expired' }]]) {
  test(`Authentication rejects ${label}`, async () => {
    const h = createHarness();
    const result = await h.invoke(h.load('middleware/auth.js').protect, { headers });
    assert.equal(result.statusCode, 401); assert.ok(result.error);
    assert.equal(h.calls.length, 0);
  });
}
test('Authentication rejects deleted user', async () => {
  const h = createHarness();
  const result = await h.invoke(h.load('middleware/auth.js').protect, { headers: { authorization: 'Bearer synthetic-token' } });
  assert.equal(result.statusCode, 401); assert.ok(result.error);
});
test('Authentication rejects deactivated user', async () => {
  const h = createHarness({ users: [{ _id: 'client-a', isActive: false }] });
  const result = await h.invoke(h.load('middleware/auth.js').protect, { headers: { authorization: 'Bearer synthetic-token' } });
  assert.equal(result.statusCode, 403); assert.ok(result.error);
});
test('Authentication accepts synthetic verified active user', async () => {
  const h = createHarness({ users: [{ _id: 'client-a', role: 'client', isActive: true }] });
  const result = await h.invoke(h.load('middleware/auth.js').protect, { headers: { authorization: 'Bearer synthetic-token' } });
  assert.equal(result.error, undefined); assert.equal(result.nextCalled, true);
});
test('Attorney authorization denies client and allows attorney', async () => {
  const h = createHarness(); const middleware = h.load('middleware/auth.js').authorize('attorney');
  assert.throws(() => middleware({ user: { role: 'client' } }, { status() {} }, () => {}), /not permitted/);
  let allowed = false; middleware({ user: { role: 'attorney' } }, {}, () => { allowed = true; });
  assert.equal(allowed, true);
});
test('Actual attorney router registers authentication and attorney-only authorization', () => {
  const h = createHarness(); const auth = h.load('middleware/auth.js');
  const uses = []; const routes = [];
  const router = { use(...handlers) { uses.push(handlers); }, get(route) { routes.push(['GET', route]); }, patch(route) { routes.push(['PATCH', route]); } };
  h.load('routes/attorneyRoutes.js', { express: { Router: () => router },
    '../controllers/attorneyController': h.load('controllers/attorneyController.js'), '../middleware/auth': auth });
  assert.equal(uses[0][0], auth.protect);
  assert.throws(() => uses[0][1]({ user: { role: 'client' } }, { status() {} }, () => {}), /not permitted/);
  assert.equal(routes.length, 5);
});

test('Actual contract router protects every contract read endpoint', () => {
  const h = createHarness(); const auth = h.load('middleware/auth.js');
  const uses = []; const routes = [];
  const router = { use(...handlers) { uses.push(handlers); }, get(route, handler) { routes.push([route, handler]); }, post() {} };
  const multer = () => ({ single: () => () => {} }); multer.memoryStorage = () => ({});
  h.load('routes/contractRoutes.js', { express: { Router: () => router }, multer,
    'express-rate-limit': () => () => {},
    '../controllers/contractController': h.load('controllers/contractController.js'), '../middleware/auth': auth });
  assert.equal(uses[0][0], auth.protect);
  assert.deepEqual(routes.map(([route]) => route), ['/', '/:id', '/:id/status', '/:id/report']);
});
