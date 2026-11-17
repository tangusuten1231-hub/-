import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { describe, companions, bloomText } from '../js/describe.js';

test('開花期の言い方', () => {
  assert.equal(bloomText([5, 6, 9, 10]), '5〜6月と9〜10月');
  assert.equal(bloomText([11, 12, 1, 2]), '11〜2月');
  assert.equal(bloomText([7]), '7月');
  assert.equal(bloomText([]), '');
});

test('すべての植物に十分な長さの解説がある', () => {
  for (const p of PLANTS) {
    const d = describe(p);
    assert.equal(d.length, 4, p.id);
    const text = d.map((x) => x.t).join('');
    assert.ok(text.length >= 150, `${p.id}: ${text.length}文字`);
    assert.ok(!/undefined|NaN|null/.test(text), p.id);
  }
});

test('相性のよい植物は同じ環境で育つ別の種', () => {
  for (const id of ['echinacea', 'hosta', 'lavender', 'orlaya', 'athyrium']) {
    const p = PLANTS.find((x) => x.id === id);
    const c = companions(p);
    assert.ok(c.length >= 3, id);
    assert.ok(c.every((q) => q.group !== p.group && q.sun.some((s) => p.sun.includes(s)) && q.moist.some((m) => p.moist.includes(m))), id);
    assert.equal(new Set(c.map((q) => q.group)).size, c.length);
  }
});
