const test = require('node:test');
const assert = require('node:assert/strict');
const { catalogQuery } = require('../server/services/marketCatalog');

test('catalog search and count share all filters, excluding blocked listings and sellers', () => {
    const query = catalogQuery({ q: "travel'", price_min: '100', price_max: '999.50', subs_min: '1000', theme: '33', monetized: 'true', page: '2' }, 'youtube', 'Купить канал', true);
    assert.deepEqual(query.errors, []);
    assert.ok(!query.sql.includes("travel'"));
    assert.deepEqual(query.params.slice(0, -2), query.countParams);
    const where = query.countSql.slice(query.countSql.indexOf('FROM'));
    assert.ok(query.sql.includes(where));
    assert.match(where, /l\.is_blocked/);
    assert.match(where, /u\.is_blocked/);
    assert.match(where, /l\.subscribers >=/);
    assert.match(where, /l\.monetization =/);
    assert.deepEqual(query.params.slice(-2), [24, 24]);
});
test('sorting is whitelisted and service filters do not apply channel-only fields', () => {
    const query = catalogQuery({ sort: 'price; DROP TABLE listings', subs_min: '1000', income_min: '300', monetized: 'true', page: '-10' }, 'youtube', 'Дизайн', false);
    assert.equal(query.filters.sort, 'recommended');
    assert.ok(!query.sql.includes('DROP'));
    assert.ok(!query.countSql.includes('subscribers'));
    assert.ok(!query.countSql.includes('monetization'));
    assert.equal(query.page, 1);
});
test('invalid ranges are reported before executing catalog queries', () => {
    for (const filters of [{ price_min: '500', price_max: '10' }, { price_max: '-1' }, { subs_min: '1.5' }, { price_min: 'Infinity' }]) {
        assert.ok(catalogQuery(filters, 'youtube', 'Купить канал', true).errors.length);
    }
});
test('zero upper bound remains an actual filter and sort direction is preserved', () => {
    const query = catalogQuery({ income_max: '0', sort: 'price_asc' }, 'youtube', 'Купить канал', true);
    assert.equal(query.filters.income_max, '0');
    assert.ok(query.countParams.includes(0));
    assert.match(query.sql, /ORDER BY l\.price ASC/);
});
