// はじめての宿根草ガーデン：地域に合わせたステップガイド
import { formatDoy, humidityStress } from './climate.js';
import { localMonth } from './garden.js';

/**
 * @param ctx { climate, loc, garden(plants[]), plan }
 * 戻り値: [{ id, title, body[], done: boolean|null（null=手動チェック）, go?: タブ }]
 */
export function guideSteps(ctx) {
  const c = ctx.climate;
  const L = (m) => (c ? localMonth(m, c.south) : m);
  const hot = c && c.heatZone >= 7;
  const cold = c && c.zone.value <= 6.5;
  const stress = c ? humidityStress(c) : 0;
  const plantWindow = !c ? '春（3〜5月）か秋（9〜11月）'
    : c.frostFree ? `秋（${L(10)}〜${L(11)}月）か春（${L(3)}〜${L(4)}月）`
    : cold ? `春は${formatDoy(c.lastFrostSafe ?? c.lastFrost)}以降、秋は${L(9)}月中`
    : `秋（${L(9)}月下旬〜${L(11)}月上旬）が最適、春なら${formatDoy(c.lastFrostSafe ?? c.lastFrost)}以降〜${L(5)}月`;

  return [
    {
      id: 'loc', title: '庭の場所を設定して気候を知る', go: 'site', done: !!ctx.climate,
      body: ['「気候」タブで現在地を設定すると、寒さ・暑さ・霜の時期から育つ植物がわかります。'],
    },
    {
      id: 'sun', title: '日当たりを観察する（朝・昼・夕の3回）', go: 'site', done: null,
      body: [
        '1日に何時間日が当たるかで植物が決まります。6時間以上＝日向、3〜5時間＝半日陰、それ以下＝日陰。',
        '冬は建物の影が長く伸びます。「気候」タブの影の長さの表も参考に。',
        hot ? 'この地域は夏が暑いので、西日が当たる場所は「半日陰向き」の植物が無難です。' : '',
      ],
    },
    {
      id: 'drain', title: '水はけを確かめる', done: null,
      body: [
        '深さ30cmの穴を掘って水を満たし、翌日までに抜ければOK。残るなら水はけ改良が必要です。',
        stress >= 2 || (c && c.annualPrecip >= 1600)
          ? 'この地域は雨や蒸し暑さで根腐れが起きやすいので、花壇を周囲より10〜20cm高く盛り上げるのがおすすめです。' : '',
      ],
    },
    {
      id: 'plan', title: 'プランを作り、植物を選ぶ', go: 'plan', done: (ctx.garden?.length || 0) > 0,
      body: [
        '最初は5〜7種類、丈夫な植物（◎・手間いらず）を中心に。同じ植物を3株以上まとめると見栄えがします。',
        '「プラン」タブで言葉のイメージから自動で組めます。',
      ],
    },
    {
      id: 'soil', title: '土づくり（植え付けの2週間前まで）', done: null,
      body: [
        '30cmほど耕し、腐葉土・堆肥を土の2〜3割混ぜます。石灰は基本不要（ラベンダー等アルカリ好きは少量）。',
        '乾燥地の植物（ラベンダー、セダム等）には肥料を控え、砂利や軽石を混ぜます。',
      ],
    },
    {
      id: 'buy', title: '苗を選ぶ・買う', done: null,
      body: [
        '葉の色が濃く、株元がしっかりした苗を。鉢底から白い根が少し見えるものが元気です。',
        '葉の裏に虫がいないか、株元が腐っていないかを確認。',
        `植え付け適期：${plantWindow}`,
      ],
    },
    {
      id: 'planting', title: '植え付ける', done: null,
      body: [
        '根鉢の2倍の穴を掘り、根鉢の表面が地面と同じ高さになるように（深植えしない）。',
        '株間は将来の大きさ（植物カードの株間）を目安に。最初はすき間が空いて見えて正解です。',
        '植えたらたっぷり水をやり、根が落ち着くまで2〜3週間は土が乾いたら水やり。',
      ],
    },
    {
      id: 'mulch', title: 'マルチングで乾燥・雑草・寒さを防ぐ', done: null,
      body: [
        '株元を避けてバークチップや腐葉土を3〜5cm敷きます。',
        cold ? 'この地域は冬が寒いので、初冬に株元を厚めに覆うと根を守れます。' : '',
        stress >= 2 ? '夏の蒸れが心配な地域なので、乾燥地の植物の株元には砂利マルチがおすすめ。' : '',
      ],
    },
    {
      id: 'water', title: '1年目は水やり、2年目からは雨まかせ', done: null,
      body: [
        '根付いた宿根草は、真夏に何日も雨がないとき以外は水やり不要になります。',
        '水やりは朝に株元へたっぷり。葉に何度もかけると病気の原因になります。',
      ],
    },
    {
      id: 'care', title: '「作業暦」に沿って手入れする', go: 'tasks', done: null,
      body: [
        '毎月の切り戻し・株分け・病害虫の見回りを、この地域とあなたの植物に合わせて表示しています。',
        '病害虫は「早く見つけて早く取り除く」がいちばんの対策です。週に1回、葉の裏と新芽を見る習慣を。',
      ],
    },
    {
      id: 'record', title: '写真で記録する', done: null,
      body: ['毎月同じ場所から写真を撮ると、来年の植え替えや追加の計画に役立ちます。花が途切れた月をメモしておきましょう。'],
    },
  ].map((s) => ({ ...s, body: s.body.filter(Boolean) }));
}
