# へやみどり 🌿

室内の観葉植物を育てるための **図鑑と記録帳**（PWA）です。インストール不要・APIキー不要で、スマホのブラウザから使えます。データは端末の中だけに保存されます。

案内役はニホンヤモリの「ヤモ」（家を守る「家守」から）。

## できること

| 画面 | 内容 |
| --- | --- |
| 🏠 ホーム | ヤモのひとこと（寒さ・日差し・ペットへの注意、出典つきの豆知識）、今日土を確かめる植物 |
| 📖 図鑑 | 37種類・25品種。ひらがな／カタカナ／学名／旧学名（例：Sansevieria、Calathea）／英名で検索。「暗めでも育つ」「乾燥に強い」「寒さに強い」「猫・犬への害の記載なし」で絞り込み。育て方の項目ごとに **出典の原文** または **目安の理由** を表示 |
| 🪴 マイ植物 | 置き場所との相性（明るさ・冬の室温）、生育期／冬の水やりの段階、次に土を確かめる日、お世話の記録 |
| 🪟 置き場所 | 窓の向き・距離・レースカーテン・実測の照度・冬の最低室温から明るさを見積もり、その場所に合う植物を提案 |
| ⚙️ 設定 | 一緒に暮らす動物（猫・犬）、バックアップの書き出し／読み込み、データの出典 |

## 動かし方

```sh
npm start          # http://localhost:8080
npm test           # データの正確さ・ロジックのテスト
```

## データの正確さの方針

1. **手で書くのは「日本語名」と「室内での育て方」だけ**。科・受理学名・旧学名は GBIF、毒性・原産地・殖やし方・耐寒ゾーンは NC State から自動で取り込みます。
2. **育て方の値にはすべて根拠を付けます。**
   - `{ "src": "ncsu", "quote": "…" }`：出典の英文そのまま。テストで、保存した出典に原文が本当にあるかを照合します。
   - `"fahrenheit": [60, 85]` を付けた根拠は、°F の数値が原文にあり、℃の値と換算が一致するかをテストします。
   - `{ "src": "estimate", "reason": "…" }`：出典に記載がない値。アプリでは「目安」と表示し、理由を見せます。
3. **毒性は「記載なし」を「安全」としません。** 出典に害の記載がない植物は「記載なし（安全とは限りません）」と表示します。
4. **矛盾をテストで検出します。** たとえば次のような値は不合格になります。
   - 最低温度が、出典の耐寒ゾーンより寒さに強い値になっている。
   - 出典に Full sun がないのに、直射日光を最適としている。
   - 冬のほうが水やりが多い。
   - 別名が2つの植物で重複している。
5. GBIF で学名が受理名でない場合（例：アレカヤシ）は、`note` での説明を必須にしています。

## データの構造

```
data/
  taxa/<id>.json          手で書くデータ（1植物1ファイル）
  sources/ncsu/<slug>.json NC State のページのスナップショット（取得日つき）
  sources/gbif/<id>.json   GBIF の照合結果（受理名・科・シノニム）
js/
  schema.js        データの決まり（段階の定義・検証）
  derive.js        出典との結合、親子の継承、根拠の照合
  catalog.data.js  自動生成（編集しない）
  care.js          明るさの見積もり・相性・水やり・検索
  db.js            ユーザーデータ（IndexedDB、移行の仕組みつき）
  guide.js         案内役ヤモ
  app.js           画面
tools/
  fetch-ncsu.mjs   NC State から取得
  fetch-gbif.mjs   GBIF で照合
  build-catalog.mjs 検証して catalog.data.js を生成
```

### 植物データ（`data/taxa/<id>.json`）

```jsonc
{
  "id": "monstera-deliciosa",
  "rank": "species",                 // genus | species | cultivar
  "scientificName": "Monstera deliciosa",
  "names": { "ja": "モンステラ・デリシオサ", "aliases": ["モンステラ", "ホウライショウ"] },
  "refs": { "ncsu": "monstera-deliciosa" },
  "care": {
    "light": { "best": "bright", "min": "medium", "directSun": "avoid" },
    "temperature": { "minC": 10, "idealC": [16, 29] },
    "humidity": "high",
    "watering": { "growing": "topdry", "winter": "halfdry" }
  },
  "evidence": {
    "temperature.idealC": [{ "src": "ncsu", "quote": "average warm temperature of 60 to 85 degrees F", "fahrenheit": [60, 85] }],
    "temperature.minC": [{ "src": "estimate", "reason": "出典に最低温度の記載がないため…" }]
    // …care のすべての項目に必要
  },
  "tips": [{ "ja": "しっかりした支柱がないと茎が折れやすい。", "src": "ncsu", "quote": "Sturdy support is necessary…" }]
}
```

- **品種**（`rank: "cultivar"`）は `parent` に種の id を書きます。親の値を引き継ぎ、書いた項目だけを上書きします。学名は「親の学名＋'品種名'」が自動で付きます。
- **明るさの段階**：`low` 300〜1,000 lux／`medium` 1,000〜5,000／`bright` 5,000〜20,000／`direct` 20,000以上。
- **水やりの段階**：`moist` 乾かしすぎない／`topdry` 表面が乾いたら／`halfdry` 半分乾いたら／`dry` しっかり乾かす。
- **`minC`**：これを下回ると傷むおそれがある温度です。
- **`idealC`**：よく育つ温度です。冬に部屋がこの範囲を保てれば、冬でも生育期として扱います。

### ユーザーデータ（IndexedDB）

`spots`（置き場所）、`plants`（マイ植物）、`events`（お世話の記録）、`meta`（設定）の4つに分けて保存します。

形式を変えるときは、`js/db.js` の `MIGRATIONS` に関数を1つ足します。既存の関数は書き換えません。

## 植物を追加する手順

1. `node tools/fetch-ncsu.mjs <NC State のページ名>` で出典を取得します。
2. `data/taxa/<id>.json` を書きます。根拠は出典の原文をそのまま引用します。
3. `node tools/fetch-gbif.mjs` で学名を照合します。
4. `npm run build` を実行します。検証に通らないと生成されません。
5. `npm test` を実行します。

## 出典・ライセンス

- [NC State Extension Gardener Plant Toolbox](https://plants.ces.ncsu.edu/)：CC BY 4.0
- [GBIF Backbone Taxonomy](https://www.gbif.org/)：CC BY 4.0

日本語名、明るさの段階（lux）の定義、水やりの日数の目安は、このアプリ独自のものです。
