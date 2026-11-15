import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../js/plan.js';
import { planSVG, elevationSVG, drawPlant } from '../js/illust.js';
import { PLANTS } from '../js/plants.js';

const climate = { zone: { value: 8.5, label: '8b' }, south: false, heatZone: 7, hotDays: 50, tropicalNights: 20, avgMinTemp: -3, annualSnow: 0 };

test('植栽の間隔：どのスタイルでも株が重なりすぎない（植え付け密度が現実的）', () => {
  for (const style of ['border', 'oudolf', 'matrix', 'jekyll', 'chatto', 'cottage']) for (const view of ['border', 'island']) {
    const pl = generatePlan({ climate, sun: 'full', moist: style === 'chatto' ? 'dry' : '', width: 4, depth: view === 'island' ? 3 : 1.6, text: '', style, view, seed: 2 });
    const pts = pl.species.filter((s) => s.role !== 'under').flatMap((s) => s.positions.map((p) => ({ ...p, s: s.plant.spread / 100 })));
    let bad = 0;
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) if (Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y) < ((pts[a].s + pts[b].s) / 2) * 0.6) bad++;
    assert.ok(bad <= Math.max(2, pts.length * 0.05), `${style}/${view}: 近すぎる株 ${bad}`);
    const cover = pts.reduce((t, p) => t + p.s * p.s, 0) / pl.area;
    assert.ok(cover < 2, `${style}/${view}: 密度 ${cover.toFixed(2)}`);
  }
});

test('春咲き球根は株間に群れで植え込まれる', () => {
  let found = false;
  for (let seed = 0; seed < 8 && !found; seed++) {
    const pl = generatePlan({ climate, sun: 'full', width: 4, depth: 1.5, text: '春', style: 'border', seed });
    const b = pl.species.find((s) => s.role === 'under');
    if (!b) continue;
    found = true;
    assert.ok(b.qty >= 5);
    assert.ok(b.positions.every((p) => p.under));
  }
  assert.ok(found);
});

test('植栽図とイメージ図：番号は植物リストと一致し、季節で姿が変わる', () => {
  const pl = generatePlan({ climate, sun: 'full', width: 4, depth: 1.5, text: '', style: 'border', seed: 1 });
  const svg = planSVG(pl);
  for (const sp of pl.species) assert.ok(svg.includes(`data-jump="cast-${sp.no}"`), sp.plant.ja);
  assert.notEqual(elevationSVG(pl, 6), elevationSVG(pl, 1));
  // 春咲き球根は夏には地上から消え、夏まきの一年草は冬にはない
  const tulip = PLANTS.find((p) => p.group === 'narcissus');
  assert.equal(drawPlant(tulip, tulip.color[0], 100, 200, 100, 8, 1), '');
  const zinnia = PLANTS.find((p) => p.group === 'zinnia');
  assert.equal(drawPlant(zinnia, zinnia.color[0], 100, 200, 100, 1, 1), '');
  assert.ok(drawPlant(zinnia, zinnia.color[0], 100, 200, 100, 8, 1).length > 100);
});
