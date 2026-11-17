import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNcsu } from '../tools/fetch-ncsu.mjs';

const html = `<h1><em>Xus yus</em><small></small></h1>
<ul class="" id="common_names"><li><a href="/x">Fake Plant</a></li></ul>
<dt>Description</dt><dd><p>Keep temperatures above 45 degrees F.&nbsp;</p></dd>
<dt>Cultivars / Varieties:</dt><dd class="d-print-none"><ul><li class="list-group-item detail_cultivar">&#x27;Nice&#x27;<br><small>green leaves</small></li></ul></dd>
Attributes:
<dl><dt>Light:</dt><dd><span>Partial Shade</span></dd><dd><span>Deep shade</span></dd>
<dt>Problems:</dt><dd><span>Problem for Cats</span></dd></dl>`;

test('NC State のページから属性を取り出す', () => {
  const r = parseNcsu(html);
  assert.equal(r.scientificName, 'Xus yus');
  assert.deepEqual(r.commonNames, ['Fake Plant']);
  assert.equal(r.description, 'Keep temperatures above 45 degrees F.');
  assert.deepEqual(r.cultivars, [{ name: 'Nice', note: 'green leaves' }]);
  assert.deepEqual(r.attributes.Light, ['Partial Shade', 'Deep shade']);
  assert.deepEqual(r.attributes.Problems, ['Problem for Cats']);
});
