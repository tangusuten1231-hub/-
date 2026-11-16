import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURES, creaturesForGarden } from '../js/wildlife.js';
import { INFO, ECO_NODES } from '../js/critterinfo.js';
import { critterSVG } from '../js/critterart.js';
import { foodWeb, foodWebSVG } from '../js/ecoweb.js';
import { FRIENDS, visitors, friendSVG } from '../js/friends.js';
import { PLANTS } from '../js/plants.js';

const climate = { zone: { value: 8.5, label: '8b' }, south: false };

test('すべての生き物に図鑑情報とイラストがある', () => {
  const ids = new Set(CREATURES.map((c) => c.id));
  for (const c of CREATURES) {
    const i = INFO[c.id];
    assert.ok(i, c.id);
    assert.ok(i.size && i.look && i.eats.length, c.id);
    assert.match(critterSVG(c.id), /^<svg/);
    for (const e of i.eats) assert.ok(e.startsWith('k:') || ECO_NODES[e] || ids.has(e), `${c.id}: ${e}`);
  }
});

test('生態系図：植物 → 虫 → 鳥のつながりができる', () => {
  const plants = PLANTS.filter((p) => ['fennel', 'echinacea', 'lavender', 'helianthus-annuus', 'achillea', 'miscanthus'].includes(p.group));
  const crit = creaturesForGarden(plants, { water: true, tree: true, compost: true }, climate);
  const web = foodWeb(crit, plants, { water: true, tree: true, compost: true });
  const tiers = new Set(web.nodes.map((n) => n.tier));
  assert.ok(tiers.has(0) && tiers.has(1) && tiers.has(3));
  assert.ok(web.edges.length > 5);
  for (const e of web.edges) assert.ok(web.nodes.some((n) => n.id === e.from) && web.nodes.some((n) => n.id === e.to));
  assert.match(foodWebSVG(web), /<svg/);
});

test('庭のお客さんは季節に合ったキャラクターだけ来る', () => {
  const ctx = (month) => ({ month, blooming: [], plants: [], features: {}, rain: false, has: () => false });
  for (let k = 0; k < 20; k++) {
    const jan = visitors(ctx(1), Math.random);
    assert.ok(jan.every((v) => v.friend.months.includes(1)));
    assert.ok(jan.length >= 1 && jan.length <= 3);
    assert.ok(jan.every((v) => typeof v.line === 'string' && v.line.length > 0));
  }
  for (const f of FRIENDS) { assert.ok(CREATURES.some((c) => c.id === f.critter), f.id); assert.match(friendSVG(f), /^<svg/); }
});

test('仲間：なかよし度の段階と、全員のひみつ・おみやげ', async () => {
  const { FRIENDS, FRIEND_EXTRA, friendLevel, friendSVG } = await import('../js/friends.js');
  assert.equal(friendLevel(0).hearts, 0);
  assert.equal(friendLevel(1).ja, 'はじめまして');
  assert.equal(friendLevel(7).ja, 'なかよし');
  assert.equal(friendLevel(30).hearts, 4);
  for (const f of FRIENDS) {
    assert.ok(FRIEND_EXTRA[f.id]?.secret && FRIEND_EXTRA[f.id].gifts.length === 3, f.id);
    assert.match(friendSVG(f), /<svg/);
  }
});
