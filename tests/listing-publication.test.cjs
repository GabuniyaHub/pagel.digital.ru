// Run with: node --test tests/listing-publication.test.cjs
// Exercise the real route handlers with isolated database/upload dependencies.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function harness({ platformExists = true } = {}) {
  const routes = new Map();
  const queries = [];
  const router = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method,
    (url, ...handlers) => routes.set(method + ' ' + url, handlers.at(-1))]));
  const middleware = () => {};
  const multer = Object.assign(() => ({ fields: () => middleware, single: () => middleware }), { diskStorage: () => ({}) });
  const client = { async query(sql, values = []) {
    queries.push({ sql, values });
    if (/SELECT id FROM platforms/.test(sql)) return { rows: platformExists ? [{ id: 7 }] : [] };
    if (/INSERT INTO platforms/.test(sql)) return { rows: [{ id: 7 }] };
    if (/SELECT id FROM categories/.test(sql)) return { rows: [{ id: 12 }] };
    if (/SELECT id, contacts FROM users/.test(sql)) return { rows: [{ id: 91, contacts: {} }] };
    if (/SELECT id FROM listings WHERE name/.test(sql)) return { rows: [] };
    if (sql === 'UPDATE listings SET position = position + 1') return { rows: [] };
    if (/MAX\(position\)/.test(sql)) return { rows: [{ max_position: 3 }] };
    if (/INSERT INTO listings/.test(sql)) {
      const columns = sql.match(/INSERT INTO listings\s*\(([\s\S]*?)\)/)[1].split(',').map(x => x.trim());
      const expressions = sql.match(/VALUES\s*\(([\s\S]*?)\)/)[1].split(',').map(x => x.trim());
      assert.equal(expressions.length, columns.length);
      assert.equal(values.length, expressions.filter(value => value.startsWith('$')).length, 'Each placeholder must have a bound value');
      return { rows: [{ id: 500, ...Object.fromEntries(columns.map((column, index) => [column,
        expressions[index].startsWith('$') ? values[Number(expressions[index].slice(1)) - 1] : Number(expressions[index])])) }] };
    }
    throw new Error('Unexpected query: ' + sql);
  } };
  const filename = path.join(root, 'server/routes/MarketRoutes/marketRoutes.js');
  const mocks = {
    express: { Router: () => router }, multer, axios: {}, fs: { existsSync: () => true },
    'node-cron': { schedule() {} }, '../../config/db': client,
    '../../middleware/authMiddleware': { verifyToken: middleware },
    '../../middleware/MarketMiddleware/checkBlockStatusWithoutToken': middleware,
    '../../middleware/MarketMiddleware/optionalAuth': middleware,
    '../../utils/cliner/cliner.js': middleware,
    '../../config/market/platforms': require('../server/config/market/platforms'),
    '../../services/marketCatalog': require('../server/services/marketCatalog'),
    '../../config/market/youtubeCatalog': require('../server/config/market/youtubeCatalog')
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    module: { exports: {} }, __dirname: path.dirname(filename),
    console: { log() {}, warn() {}, error() {} }, URL, Buffer, process
  }, { filename });
  return { queries, async call(route, body, file = { filename: 'test.png' }) {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await routes.get('post ' + route)({ user: { id: 91 }, body, file, files: { avatar: [file] } }, res);
    return res;
  } };
}

const channel = {
  name: 'Test YouTube channel', subscribers: '12000', link: 'https://www.youtube.com/channel/UCwj1T2R1bZLJqfVFuqO_9UA',
  theme: '3', price: '125.50', description: 'Channel description for publication.',
  allow_comments: 'on', show_link: 'on', flex_switch: 'on', category_name: 'channel-buy',
  category_description: 'YouTube channel', platform_id: 'youtube', form_type: '1', contacts: { email: 'test@example.com' }
};
for (const platformExists of [true, false]) {
  test('channel publication resolves YouTube slug; platform exists=' + platformExists, async () => {
    const app = harness({ platformExists });
    const res = await app.call('/create-listings', { ...channel });
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    const listing = res.body.listing;
    assert.equal(listing.price, 125.5);
    assert.equal(listing.description, channel.description);
    assert.equal(listing.user_id, 91);
    assert.equal(listing.category_id, 12);
    assert.equal(listing.subscribers, 12000);
    assert.equal(listing.cover, 'test.png');
    assert.equal(listing.allow_comments, true);
    assert.equal(listing.form_type, 1);
    assert.equal(listing.contacts.email, 'test@example.com');
    const categoryQuery = app.queries.find(query => /SELECT id FROM categories/.test(query.sql));
    assert.equal(categoryQuery.values[1], 7);
  });
}
test('channel rejects a missing or nonpositive price before insertion', async () => {
  for (const price of ['', '0', '-1']) {
    const app = harness();
    const res = await app.call('/create-listings', { ...channel, price });
    assert.equal(res.statusCode, 400);
    assert.equal(app.queries.some(query => /INSERT INTO listings/.test(query.sql)), false);
  }
});
test('service publication accepts the same YouTube slug', async () => {
  const app = harness({ platformExists: false });
  const res = await app.call('/simple-listing', {
    ...channel, name: 'Design YouTube thumbnail', form_type: '2', user_id: '999',
    contacts: JSON.stringify({email:'test@example.com'})
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  const insert = app.queries.find(query => /INSERT INTO listings/.test(query.sql));
  assert.ok(insert);
  assert.ok(insert.values.includes(91), 'Owner must come from the authenticated session');
  assert.ok(!insert.values.includes('999'));
});
