---
name: pr-ui-media
description: >-
  Captures Playwright screenshots (and short videos when motion, loading, or
  multi-step flows matter) for both mobile and desktop, then attaches them to
  pull requests. Use when creating or updating a PR that includes UI changes, or
  when the user asks to attach screenshots or videos to a PR.
---

# PR UI メディア添付

UI 変更がある PR では、作成前に Playwright で **mobile + desktop** の見た目を撮り、PR 本文に添付する。

## いつ使うか

- ユーザーが PR 作成・更新を依頼したとき
- 差分に UI 変更があるとき（下記）

## UI 変更の判定

次にヒットしたら撮影する:

- `src/app/**`（`page.tsx` / `layout.tsx` / CSS。ただし `src/app/api/**` は除外）
- `src/components/**`
- `public/**`（画像・Lottie など）

API / `src/lib/**` のみならスキップ。ただしローディング表示など UI 影響が明らかなら撮る。

## メディア判断

| 状況 | メディア |
|------|----------|
| レイアウト・文言・色・配置 | スクショ（デフォルト） |
| Lottie / ローディング待ち | 短尺動画 |
| 複数画面の一連操作 | 短尺動画 |
| before/after | スクショ 2 枚（可能なら） |

動画は目安 5–15 秒。viewport は常に両方。

## 手順

0. **前提確認**
   - `playwright` が devDependencies に入っていること（無ければ `npm i -D playwright`）
   - 初回は Chromium が必要: `npx playwright install chromium`
   - `gh` が 2.99.0 以上であること（`gh --version`。`--attach` は 2.99.0 で追加）
1. **ルート選定** — 変更に対応するパス（例: `/scan`, `/library`, `/login`, `/`）
2. **アプリ起動** — `npm run dev` 等が `http://localhost:3000` で応答していること
3. **撮影**

```bash
npm run pr-media -- /scan /library
# 動画が必要なとき
npm run pr-media -- --video --duration 8 /scan
```

4. **manifest 確認** — 1 件でも失敗すると exit code 1 で終わる。`.pr-media/manifest.json` の `ok: false` は未撮影理由として本文へ書き、そのファイルは `--attach` しない。
   - 未ログインでサインイン画面へリダイレクトされた場合も `ok: false`（`redirected to ...`）になる。ログイン自動化はしない
   - manifest は実行ごとに追記される（同じファイルは上書き）。`capturedAt` で今回の結果か確認する
5. **PR 本文** — リポジトリルートの [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) を読み、コピーして埋める。
   - 構成はテンプレ通り（変更内容 → 変更ファイル → UI/UX）。スキル側で本文フォーマットを再定義しない
   - **変更内容**: 変更の要点を箇条書き
   - **変更ファイル**: この PR で触ったファイルを一覧（`git diff --name-only` など）
   - **UI/UX**: テンプレのコメント（`<!-- -->`）を外し、プレースホルダを実ファイルパス（`.pr-media/...`）に差し替える。使わない節は消す。UI 変更なしなら「なし」だけ書く
   - 本文の画像パスと `--attach` のパスは **完全に同じ文字列** にする（`./` の有無も揃える）。ずれると本文に壊れた画像が残り、添付は末尾に重複して付く
6. **添付** — ホストで分岐（詳細は [reference.md](reference.md)）

**GitHub（このリポジトリの通常経路） / 他エージェント**

埋めた本文を `--body-file` にし、メディアを `--attach` する。

```bash
gh pr create --title "..." --body-file /tmp/pr-body.md \
  --attach '.pr-media/scan-mobile.png#scan (mobile)' \
  --attach '.pr-media/scan-desktop.png#scan (desktop)'
```

**Cursor Origin ホスト**

- `upload_pull_request_attachment` でアップロードし、返った URL を本文へ
- 画像: `![alt](url)` / 動画: URL を単独行
- 約 750KB 超なら圧縮、だめなら `gh --attach` にフォールバック

## 出力ファイル

- スクショ: `.pr-media/{route}-{mobile|desktop}.png`
- 動画: `.pr-media/flow-{routes}-{mobile|desktop}.webm`
- 一覧: `.pr-media/manifest.json`

## ローカルファイル

`.pr-media/` は gitignore 済み。`--attach` 成功後は削除してよい（PR 上はアップロード先 URL を参照する）。
