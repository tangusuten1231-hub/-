// iNaturalist（市民が投稿する生き物の観察記録。APIキー不要）から、庭の近くで実際に観察された生き物・植物を調べる
// 研究用グレード（ほかの人が種を確認した記録）だけを使う。写真は撮影者のライセンス表示つきで表示する。

export const INAT_GROUPS = {
  bird: { ja: '野鳥', taxon: 3 },
  butterfly: { ja: '蝶', taxon: 47224 },
  insect: { ja: '虫', taxon: 47158 },
  herp: { ja: 'カエル・トカゲ', taxon: '20978,26036' },
  plant: { ja: '植物', taxon: 47126 },
};

export function inatURL(lat, lon, group, radiusKm = 5) {
  const g = INAT_GROUPS[group] || INAT_GROUPS.bird;
  const p = new URLSearchParams({ lat: lat.toFixed(3), lng: lon.toFixed(3), radius: String(radiusKm), quality_grade: 'research', locale: 'ja', per_page: '30', taxon_id: String(g.taxon) });
  return `https://api.inaturalist.org/v1/observations/species_counts?${p}`;
}

/** 近くで観察された種（多い順）。戻り値 [{ id, ja, latin, count, photo, credit, url }] */
export async function fetchNearby(lat, lon, group, fetchFn = fetch, radiusKm = 5) {
  const res = await fetchFn(inatURL(lat, lon, group, radiusKm));
  if (!res.ok) throw new Error('iNaturalist から取得できませんでした');
  const j = await res.json();
  return (j.results || []).filter((r) => r.taxon).map((r) => ({
    id: r.taxon.id,
    ja: r.taxon.preferred_common_name || r.taxon.name,
    latin: r.taxon.name,
    count: r.count,
    photo: r.taxon.default_photo?.square_url || '',
    credit: r.taxon.default_photo?.attribution || '',
    url: `https://www.inaturalist.org/taxa/${r.taxon.id}`,
  }));
}

/** アプリの図鑑（生き物・植物）と結びつける */
export function matchLocal(list, creatures, plants) {
  const norm = (s) => String(s || '').replace(/[（(].*?[）)]/g, '').replace(/\s/g, '');
  const byJa = new Map(creatures.map((c) => [norm(c.ja), c]));
  return list.map((x) => {
    const cr = byJa.get(norm(x.ja));
    const sp = x.latin.split(' ').slice(0, 2).join(' ');
    const pl = plants && x.latin.includes(' ') ? plants.find((p) => p.latin.startsWith(sp)) : null;
    return { ...x, critter: cr?.id || null, plant: pl || null };
  });
}
