// 園芸ノート：できごとの種類、過去の記録からのお知らせ（リマインド・提案）、実際の開花月、年間まとめ

// できごと。group ごとに並べて表示する
export const EVENTS = {
  // 生長
  sprout: { ja: '芽が出た', group: 'grow' },
  bud: { ja: 'つぼみ', group: 'grow' },
  'bloom-start': { ja: '咲き始め', group: 'grow' },
  peak: { ja: '満開', group: 'grow' },
  'bloom-end': { ja: '咲き終わり', group: 'grow' },
  autumn: { ja: '紅葉', group: 'grow' },
  dead: { ja: '枯れた', group: 'grow' },
  // 作業
  sow: { ja: '種まき', group: 'work' },
  plant: { ja: '植え付け', group: 'work' },
  water: { ja: '水やり', group: 'work' },
  feed: { ja: '肥料', group: 'work' },
  cut: { ja: '切り戻し', group: 'work' },
  divide: { ja: '株分け', group: 'work' },
  stake: { ja: '支柱', group: 'work' },
  mulch: { ja: 'マルチ', group: 'work' },
  weed: { ja: '草取り', group: 'work' },
  seed: { ja: '種取り', group: 'work' },
  harvest: { ja: '収穫', group: 'work' },
  // 天気・生き物
  'frost-first': { ja: '初霜', group: 'nature' },
  'frost-last': { ja: '最後の霜', group: 'nature' },
  snow: { ja: '雪', group: 'nature' },
  rain: { ja: '大雨', group: 'nature' },
  heat: { ja: '猛暑', group: 'nature' },
  butterfly: { ja: '蝶・蜂', group: 'nature' },
  bird: { ja: '野鳥', group: 'nature' },
  // トラブル
  disease: { ja: '病気', group: 'trouble' },
  pest: { ja: '害虫', group: 'trouble' },
  steam: { ja: '蒸れ', group: 'trouble' },
  fallen: { ja: '倒れた', group: 'trouble' },
};
export const EVENT_GROUPS = { grow: '生長', work: '作業', nature: '天気・生き物', trouble: 'トラブル' };

const WORK = ['sow', 'plant', 'feed', 'cut', 'divide', 'stake', 'mulch', 'seed', 'harvest'];
const TROUBLE_HINT = {
  disease: '今年は早めに風通しをよくして、傷んだ葉を取り除いておきましょう。',
  pest: '今年は早めに葉の裏と新芽を見回りましょう。',
  steam: '梅雨の前に切り戻して、株元の風通しをよくしておきましょう。',
  fallen: '今年は早めに支柱を立てるか、摘心して草丈を抑えましょう。',
};

const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
const doy = (m, d) => Math.round((Date.UTC(2023, m - 1, d) - Date.UTC(2023, 0, 1)) / 86400000);
/** 今日から見て何日先か（年をまたいで -182〜182 に収める） */
function daysAhead(e, today) {
  const t = doy(today.getMonth() + 1, today.getDate());
  let diff = doy(e.m, e.d) - t;
  if (diff > 182) diff -= 365;
  if (diff < -182) diff += 365;
  return diff;
}
const md = (e) => `${e.m}/${e.d}`;

/**
 * 過去の年の記録から、今の時期に役立つお知らせを作る
 * @param entries [{ date:'YYYY-MM-DD', plants:[id], events:[key], text, photo, gardenId }]
 * @param nameOf 植物ID → 名前
 * 戻り値: [{ type:'memory'|'bloom'|'work'|'trouble'|'frost'|'lesson', title, text, plant, days, photo }]
 */
export function insights(entries, today = new Date(), nameOf = (id) => id) {
  const year = today.getFullYear();
  const past = entries.filter((e) => parse(e.date).y < year);
  const out = [];
  const seen = new Set();
  // 新しい年の記録を優先
  const sorted = [...past].sort((a, b) => b.date.localeCompare(a.date));

  for (const e of sorted) {
    const d = parse(e.date);
    const ahead = daysAhead(d, today);
    const ago = year - d.y === 1 ? '去年' : `${year - d.y}年前`;
    const targets = e.plants?.length ? e.plants : [null];
    for (const pid of targets) {
      const who = pid ? nameOf(pid) : '庭';
      for (const ev of e.events || []) {
        const key = `${pid}|${ev}`;
        if (seen.has(key)) continue;
        if (ahead > 0 && ahead <= 21) {
          if (ev === 'bloom-start') { seen.add(key); out.push({ type: 'bloom', days: ahead, plant: pid, title: `もうすぐ${who}が咲く頃`, text: `${ago}は${md(d)}に咲き始めました。つぼみを探してみましょう。` }); }
          else if (WORK.includes(ev)) { seen.add(key); out.push({ type: 'work', days: ahead, plant: pid, title: `そろそろ${who}の${EVENTS[ev].ja}`, text: `${ago}は${md(d)}に行いました。` }); }
          else if (TROUBLE_HINT[ev]) { seen.add(key); out.push({ type: 'trouble', days: ahead, plant: pid, title: `${who}の${EVENTS[ev].ja}に注意`, text: `${ago}は${md(d)}に記録があります。${TROUBLE_HINT[ev]}` }); }
          else if (ev === 'frost-first') { seen.add(key); out.push({ type: 'frost', days: ahead, plant: null, title: 'そろそろ初霜の頃', text: `${ago}の初霜は${md(d)}でした。寒さに弱い植物の防寒の準備を。` }); }
          else if (ev === 'frost-last') { seen.add(key); out.push({ type: 'frost', days: ahead, plant: null, title: '遅霜はもう少し', text: `${ago}の最後の霜は${md(d)}でした。それまでは苗の植え付けに不織布を用意しておくと安心です。` }); }
        }
      }
    }
    // 思い出：去年の今頃
    if (Math.abs(ahead) <= 5 && (e.text || e.photo || e.events?.length)) {
      const k = `mem|${e.date}`;
      if (!seen.has(k)) {
        seen.add(k);
        const what = [(e.plants || []).map(nameOf).join('・'), (e.events || []).map((x) => EVENTS[x]?.ja).filter(Boolean).join('・')].filter(Boolean).join('：');
        out.push({ type: 'memory', days: ahead, plant: e.plants?.[0] ?? null, photo: e.photo || null, title: `${ago}の今頃（${md(d)}）`, text: [what, e.text].filter(Boolean).join('　') });
      }
    }
  }

  // 枯れた記録からの提案（植え付けの季節に）
  const month = today.getMonth() + 1;
  if ([3, 4, 5, 9, 10, 11].includes(month)) {
    const dead = sorted.find((e) => (e.events || []).includes('dead') && e.plants?.length && year - parse(e.date).y <= 2);
    if (dead) out.push({ type: 'lesson', days: 99, plant: dead.plants[0], title: `${nameOf(dead.plants[0])}が枯れた記録があります`, text: '同じ場所に植えるなら、水はけや日当たりを見直すか、この庭の条件に合う別の植物も検討してみましょう。' });
  }

  const order = { trouble: 0, frost: 1, work: 2, bloom: 3, memory: 4, lesson: 5 };
  return out.sort((a, b) => order[a.type] - order[b.type] || a.days - b.days);
}

/** 記録された実際の開花月（植物ID → 月の Set） */
export function actualBloom(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!(e.events || []).some((x) => ['bloom-start', 'peak', 'bloom-end'].includes(x))) continue;
    const m = parse(e.date).m;
    for (const pid of e.plants || []) { if (!map.has(pid)) map.set(pid, new Set()); map.get(pid).add(m); }
  }
  return map;
}

/** その年のまとめ */
export function yearStats(entries, year) {
  const list = entries.filter((e) => parse(e.date).y === year);
  const days = new Set(list.map((e) => e.date)).size;
  const count = {};
  const bloomed = new Set();
  for (const e of list) for (const ev of e.events || []) {
    count[ev] = (count[ev] || 0) + 1;
    if (['bloom-start', 'peak'].includes(ev)) (e.plants || []).forEach((p) => bloomed.add(p));
  }
  return { entries: list.length, days, count, bloomed: bloomed.size, photos: list.filter((e) => e.photo).length };
}

/** 植物ごとの最後のできごと（例：最後に水やりした日） */
export function lastEvent(entries, ev, plantId = null) {
  const hit = entries.filter((e) => (e.events || []).includes(ev) && (plantId == null || (e.plants || []).includes(plantId))).sort((a, b) => b.date.localeCompare(a.date))[0];
  return hit ? hit.date : null;
}
