// 手で書いたデータ（data/taxa）と出典スナップショット（data/sources）から、
// アプリが使う図鑑データを組み立てる。ブラウザ・Node の両方で動く純粋な関数だけを置く。
import { CARE_FIELDS, getPath, fToC, QUOTED } from './schema.js';

/** 引用照合用に文字列を正規化（空白・引用符・大文字小文字の違いを無視） */
export const normText = (s) => String(s)
  .replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ').trim().toLowerCase();

/** NC State スナップショットの中で引用を探せる本文（説明文・属性・品種メモ） */
export function ncsuCorpus(snap) {
  if (!snap) return '';
  const parts = [snap.description ?? ''];
  for (const [k, vs] of Object.entries(snap.attributes ?? {})) parts.push(`${k}: ${vs.join(' | ')}`);
  for (const c of snap.cultivars ?? []) parts.push(`${c.name} ${c.note}`);
  return normText(parts.join('\n'));
}

/** Clemson HGIC の抜粋（段落）の本文 */
export function hgicCorpus(snap) {
  if (!snap) return '';
  return normText((snap.paragraphs ?? []).map((p) => p.text).join('\n'));
}

/** USDA 耐寒性ゾーン（例 "10a"）の最低気温（℃） */
export function zoneMinC(zone) {
  const m = String(zone).trim().match(/^(\d+)([ab]?)$/);
  if (!m) return null;
  const f = -60 + 10 * (Number(m[1]) - 1) + (m[2] === 'b' ? 5 : 0);
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

/** NC State の属性から毒性の記載を取り出す。記載がない＝安全、とはしない */
export function toxicityFrom(snap) {
  if (!snap) return null;
  const a = snap.attributes ?? {};
  const p = a.Problems ?? [];
  const has = (x) => p.includes(x);
  return {
    cats: has('Problem for Cats') ? 'listed' : 'not-listed',
    dogs: has('Problem for Dogs') ? 'listed' : 'not-listed',
    children: has('Problem for Children') ? 'listed' : 'not-listed',
    humans: has('Poisonous to Humans') ? 'listed' : 'not-listed',
    dermatitis: has('Contact Dermatitis') || (a['Causes Contact Dermatitis'] ?? [])[0] === 'Yes',
    severity: (a['Poison Severity'] ?? [])[0] ?? null,
    principle: (a['Poison Toxic Principle'] ?? [])[0] ?? null,
    symptoms: (a['Poison Symptoms'] ?? [])[0] ?? null,
    parts: a['Poison Part'] ?? [],
  };
}

/** NC State の属性から、室内栽培に役立つ事実を取り出す */
export function factsFrom(snap) {
  if (!snap) return null;
  const a = snap.attributes ?? {};
  const zones = (a['USDA Plant Hardiness Zone'] ?? []).join(',').split(',').map((z) => z.trim()).filter(Boolean);
  const mins = zones.map(zoneMinC).filter((x) => x != null);
  return {
    origin: (a['Country Or Region Of Origin'] ?? [])[0] ?? null,
    growthRate: (a['Growth Rate'] ?? [])[0] ?? null,
    habit: a['Habit/Form'] ?? [],
    propagation: a['Recommended Propagation Strategy'] ?? [],
    hardinessZones: zones,
    hardinessMinC: mins.length ? Math.min(...mins) : null,
    invasive: (a.Problems ?? []).includes('Invasive Species'),
    maintenance: (a.Maintenance ?? [])[0] ?? null,
  };
}

const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
function deepMerge(base, over) {
  if (over === undefined) return clone(base);
  if (base === undefined || typeof over !== 'object' || Array.isArray(over) || over === null) return clone(over);
  const out = clone(base);
  for (const [k, v] of Object.entries(over)) out[k] = deepMerge(out[k], v);
  return out;
}

/**
 * 親（属 → 種 → 品種）をたどって育て方と根拠を引き継いだ1件を返す。
 * 根拠は項目ごとに「その値を書いた階層」のものを使う。
 */
export function resolveTaxon(id, byId, seen = new Set()) {
  const t = byId.get(id);
  if (!t) throw new Error(`未知の id: ${id}`);
  if (seen.has(id)) throw new Error(`親子関係が循環しています: ${id}`);
  seen.add(id);
  if (!t.parent) {
    return { ...clone(t), tips: t.tips ?? [], parentTips: [], note: t.note ?? null, parentNote: null, lineage: [id], inherited: {} };
  }
  const p = resolveTaxon(t.parent, byId, seen);
  const care = deepMerge(p.care, t.care);
  const evidence = { ...p.evidence };
  const inherited = { ...p.inherited };
  for (const f of CARE_FIELDS) {
    if (getPath(t.care ?? {}, f) !== undefined) { evidence[f] = t.evidence[f]; delete inherited[f]; }
    else if (getPath(care, f) !== undefined && !inherited[f]) inherited[f] = p.id;
  }
  return {
    ...clone(t),
    // 品種群（〜 Group）は引用符を付けない（例：Begonia Rex Cultorum Group）
    scientificName: t.rank === 'cultivar' ? (/ Group$/.test(t.cultivar) ? `${p.scientificName} ${t.cultivar}` : `${p.scientificName} '${t.cultivar}'`) : t.scientificName,
    parentName: p.names.ja,
    refs: { ...p.refs, ...t.refs },
    care, evidence, inherited,
    tips: t.tips ?? [],
    parentTips: [...(p.parentTips ?? []), ...(p.tips ?? [])],
    lineage: [...p.lineage, id],
    note: t.note ?? null,
    parentNote: p.note ?? p.parentNote ?? null,
    toxicity: t.toxicity ?? p.toxicity,
  };
}

/** 図鑑の1件を作る（出典の情報を合わせる） */
export function buildEntry(id, byId, sources) {
  const r = resolveTaxon(id, byId);
  const speciesId = r.lineage.find((x) => byId.get(x).rank !== 'cultivar' && sources.gbif[x]) ?? r.lineage[0];
  const g = sources.gbif[speciesId] ?? null;
  const n = r.refs.ncsu ? sources.ncsu[r.refs.ncsu] ?? null : null;
  const h = r.refs.hgic ? sources.hgic?.[r.refs.hgic] ?? null : null;
  let toxicity = toxicityFrom(n);
  if (r.toxicity && toxicity) {
    toxicity = { ...toxicity, extra: r.toxicity.evidence };
    for (const k of ['cats', 'dogs', 'children', 'humans']) if (r.toxicity[k] === 'listed') toxicity[k] = 'listed';
  }
  const groupOf = (x) => { for (let y = byId.get(x); y; y = y.parent ? byId.get(y.parent) : null) if (y.group) return y.group; return null; };
  const img = r.refs.ncsu ? sources.images?.[r.refs.ncsu] ?? null : null;
  return {
    id: r.id, rank: r.rank, parent: r.parent ?? null, lineage: r.lineage, group: groupOf(r.id),
    image: img ? { src: `img/plants/${r.refs.ncsu}.jpg`, author: img.author, license: img.license, licenseUrl: img.licenseUrl, caption: img.caption, ofParent: r.rank === 'cultivar' } : null,
    scientificName: r.scientificName, cultivar: r.cultivar ?? null,
    names: { ja: r.names.ja, aliases: r.names.aliases ?? [] },
    parentName: r.parentName ?? null,
    family: g?.family ?? null,
    taxonomy: g ? { acceptedName: g.acceptedName, status: g.status, synonyms: g.synonyms, url: g.url, retrieved: g.retrieved } : null,
    care: r.care, evidence: r.evidence, inherited: r.inherited,
    tips: r.tips, parentTips: r.parentTips,
    note: r.note, parentNote: r.parentNote,
    toxicity, facts: factsFrom(n),
    ncsu: n ? { url: n.url, retrieved: n.retrieved, commonNames: n.commonNames } : null,
    hgic: h ? { url: h.url, title: h.title, id: h.hgic, retrieved: h.retrieved } : null,
  };
}

/**
 * 引用・換算の照合。問題をメッセージの配列で返す。
 * - src: 'ncsu' の quote は出典スナップショットに原文がなければならない
 * - fahrenheit を書いた根拠は、その数値が原文にあり、℃ の値と一致しなければならない
 */
export function checkEvidence(t, byId, snaps) {
  const errs = [];
  // 互換：第3引数に NC State のスナップショットだけを渡す呼び出し
  const all = snaps.ncsu || snaps.hgic ? snaps : { ncsu: snaps };
  const refOf = (src) => { for (let x = t; x; x = x.parent ? byId.get(x.parent) : null) if (x.refs?.[src]) return x.refs[src]; return null; };
  const corpusOf = {};
  const check = (where, src, q) => {
    const ref = refOf(src);
    const snap = ref ? all[src]?.[ref] : null;
    if (!snap) { errs.push(`${t.id} ${where}: 出典スナップショット ${src}/${ref} がない`); return; }
    corpusOf[src] ??= src === 'ncsu' ? ncsuCorpus(snap) : hgicCorpus(snap);
    if (!corpusOf[src].includes(normText(q))) errs.push(`${t.id} ${where}: 原文が出典（${src}）に見つからない「${q}」`);
  };
  for (const [field, list] of Object.entries(t.evidence ?? {})) {
    for (const x of list) {
      if (QUOTED.includes(x.src)) check(field, x.src, x.quote);
      if (x.fahrenheit) {
        for (const f of x.fahrenheit) if (!new RegExp(`(^|[^0-9])${f}([^0-9]|$)`).test(x.quote)) errs.push(`${t.id} ${field}: ${f}°F が原文にない`);
        const v = getPath(t.care, field);
        const cs = x.fahrenheit.map(fToC);
        if (field === 'temperature.minC' && v !== cs[0]) errs.push(`${t.id} ${field}: ${x.fahrenheit[0]}°F = ${cs[0]}℃ だが値は ${v}`);
        if (field === 'temperature.idealC') {
          if (v[0] !== cs[0]) errs.push(`${t.id} ${field}: 下限 ${x.fahrenheit[0]}°F = ${cs[0]}℃ だが値は ${v[0]}`);
          if (cs.length > 1 && v[1] !== cs[1]) errs.push(`${t.id} ${field}: 上限 ${x.fahrenheit[1]}°F = ${cs[1]}℃ だが値は ${v[1]}`);
        }
      }
    }
  }
  for (const tip of t.tips ?? []) check('tips', tip.src, tip.quote);
  for (const x of t.toxicity?.evidence ?? []) check('toxicity', x.src, x.quote);
  return errs;
}
