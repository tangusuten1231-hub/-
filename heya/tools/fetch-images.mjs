// 植物の写真を NC State のページの写真から1枚選び、縮小して img/plants/<slug>.jpg に保存する。
// 使うのは改変・再配布が認められたライセンス（CC BY / CC BY-SA / CC0 / パブリックドメイン）の写真だけ。
// 撮影者・ライセンスは data/sources/images/<slug>.json に残し、アプリで表示する。
// 選ばれた写真が合わないときは data/image-choice.json に { "<slug>": "<画像id>" } を書いて指定する。
// 使い方: node tools/fetch-images.mjs [slug ...]   （引数なしなら data/sources/ncsu のすべて）
import { readdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

export const LICENSE_OK = /^(CC[ -]BY(-SA)? [\d.]+|CC0( [\d.]+)?|Public Domain Mark [\d.]+)$/;

/** 写真の向き不向きを点数にする（全体の姿が写っているものを優先） */
export function scoreImage(img) {
  if (!LICENSE_OK.test(img.license)) return -Infinity;
  const c = img.caption.toLowerCase();
  let s = 0;
  if (/houseplant|potted|container|indoor|pot\b/.test(c)) s += 5;
  if (/\b(form|habit|whole|plant)\b/.test(c)) s += 3;
  if (/leaf|leaves|foliage/.test(c)) s += 1;
  if (/flower|bloom|inflorescence/.test(c)) s += 1;
  if (/close-?up|detail|root|bark|stem|bud|seed|fruit|petiole|underside|back of|attachment|label|insect|pest|damage|disease|scale|mite/.test(c)) s -= 4;
  return s;
}

const readJson = async (p, d) => JSON.parse(await readFile(p, 'utf8').catch(() => JSON.stringify(d)));

if (import.meta.url === `file://${process.argv[1]}`) {
  const choice = await readJson('data/image-choice.json', {});
  const slugs = process.argv.length > 2 ? process.argv.slice(2) : (await readdir('data/sources/ncsu')).map((f) => f.replace(/\.json$/, ''));
  const tmp = await mkdtemp(`${tmpdir()}/img-`);
  for (const slug of slugs) {
    const snap = await readJson(`data/sources/ncsu/${slug}.json`, null);
    if (!snap) continue;
    const imgs = snap.images ?? [];
    const pick = choice[slug] ? imgs.find((i) => i.id === String(choice[slug]))
      : imgs.map((i, n) => ({ i, s: scoreImage(i) - n * 0.01 })).filter((x) => x.s > -Infinity).sort((a, b) => b.s - a.s)[0]?.i;
    if (!pick || !LICENSE_OK.test(pick.license)) { console.log(`-- ${slug}: 使える写真なし`); continue; }
    const res = await fetch(pick.file);
    if (!res.ok) { console.log(`NG ${slug}: HTTP ${res.status}`); process.exitCode = 1; continue; }
    const raw = `${tmp}/${slug}`;
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
    execFileSync('convert', [`${raw}[0]`, '-auto-orient', '-resize', '600x600>', '-strip', '-interlace', 'Plane', '-quality', '68', `img/plants/${slug}.jpg`]);
    await writeFile(`data/sources/images/${slug}.json`, JSON.stringify({
      imageId: pick.id, caption: pick.caption, author: pick.author, license: pick.license, licenseUrl: pick.licenseUrl,
      original: pick.file, page: snap.url, retrieved: new Date().toISOString().slice(0, 10),
    }, null, 1) + '\n');
    console.log(`ok ${slug}: ${pick.caption} / ${pick.author} / ${pick.license}`);
    await new Promise((r) => setTimeout(r, 200));
  }
  await rm(tmp, { recursive: true });
}
