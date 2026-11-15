// 植栽での役割（グラウンドカバー・縁取り・骨格など）。植物の高さ・形・性質から判定する。
export const ROLES = {
  groundcover: { ja: 'グラウンドカバー', text: '地面を覆って土の乾燥や雑草を防ぐ、低く広がる植物' },
  edging: { ja: '縁取り（エッジ）', text: '花壇や小道の縁に並べて輪郭を整える、低くまとまる植物' },
  shadecover: { ja: '日陰の下草', text: '木の下や建物の北側など、日陰の地面を彩る植物' },
  filler: { ja: 'すき間を埋める（フィラー）', text: '軽やかな花や葉で、植物どうしをふんわりつなぐ' },
  matrix: { ja: '地模様（マトリクス）', text: '全体に散らして植栽の背景になる、グラスなどのくり返し' },
  accent: { ja: 'アクセント（主役）', text: '形や色が際立ち、視線を集める植物' },
  structure: { ja: '骨格（ストラクチャー）', text: '背が高くしっかりして、冬の枯れ姿まで形を保つ植物' },
  screen: { ja: '目隠し・背景', text: '背丈が高く、奥の背景や目隠しになる植物' },
  hanging: { ja: '垂れ下がる（ハンギング向き）', text: '鉢の縁やハンギングから枝垂れて広がる植物' },
};

const GC = ['thymus', 'ajuga', 'vinca', 'lamium', 'pachysandra', 'ophiopogon', 'phlox-subulata', 'cerastium', 'lysimachia-aurea', 'galium', 'dichondra', 'hedera', 'hatsuyuki', 'fragaria', 'strawberry', 'saxifraga', 'tiarella', 'epimedium', 'liriope', 'sedum-acre', 'muehlenbeckia', 'erigeron', 'geranium-sanguineum', 'chamaemelum', 'portulaca', 'veronica-umbrosa', 'houttuynia', 'asarum', 'kakidooshi', 'bistorta-affinis', 'gazania', 'gotu-kola'];
const HANG = ['bacopa', 'dichondra', 'lobelia-erinus', 'calibrachoa', 'petunia', 'hedera', 'muehlenbeckia', 'hatsuyuki', 'lysimachia-aurea', 'tropaeolum', 'scaevola', 'vinca', 'erigeron', 'thymus', 'lobularia', 'portulaca', 'brachyscome', 'kakidooshi', 'plumbago'];
const ACCENT_G = ['paeonia', 'allium', 'echinops', 'eryngium', 'kniphofia', 'agapanthus', 'iris-germanica', 'lilium', 'artichoke', 'papaver', 'helianthus-annuus', 'alcea', 'digitalis', 'delphinium', 'angelica', 'lupinus', 'crocosmia', 'hydrangea-quercifolia', 'olive', 'lemon', 'phormium', 'anigozanthos', 'gloriosa', 'eucomis', 'kniphofia'];

/** 植物の役割（配列） */
export function rolesOf(p) {
  const r = [];
  const h = p.h[1];
  const g = p.group || p.id;
  if (GC.includes(g) || (h <= 25 && p.spread >= 30 && p.form !== 'grass' && p.type !== 'bulb' && p.type !== 'annual')) r.push('groundcover');
  if (h <= 45 && p.spread <= 45 && ['mound', 'globe', 'grass', 'daisy'].includes(p.form) && p.type !== 'bulb' && !GC.includes(g)) r.push('edging');
  if (!p.sun.includes('full') && h <= 60) r.push('shadecover');
  if (['airy', 'plate'].includes(p.form) && h >= 30 && h <= 130) r.push('filler');
  if (p.form === 'grass' && h >= 30 && h <= 130 && p.type !== 'annual') r.push('matrix');
  if (ACCENT_G.includes(g) || (p.form === 'globe' && h >= 50) || (p.form === 'daisy' && h >= 70 && p.color[0] !== 'white') || (['silver', 'bronze'].includes(p.leaf) && h >= 40 && p.form !== 'grass')) r.push('accent');
  if (h >= 90 && (['spike', 'grass', 'plate', 'globe'].includes(p.form) || p.type === 'shrub') && p.type !== 'annual') r.push('structure');
  if (h >= 150) r.push('screen');
  if (HANG.includes(g)) r.push('hanging');
  return r;
}
