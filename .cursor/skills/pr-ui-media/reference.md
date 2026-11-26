# PR UI メディア — 添付リファレンス

## PR 本文テンプレート

本文の骨格は [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) を使う。スキルは UI/UX 節のパス差し替えと `--attach` だけ担当する。

## gh --attach（GitHub）

対応コマンド: `gh pr create` / `gh pr edit` / `gh pr comment`（issue 系も同様）。

```bash
gh pr create \
  --title "Fix scan layout" \
  --body-file /tmp/pr-body.md \
  --attach '.pr-media/scan-mobile.png#scan (mobile)' \
  --attach '.pr-media/scan-desktop.png#scan (desktop)'
```

- gh 2.99.0 以上が必要
- `--attach` は繰り返し可
- 画像の alt は `path#alt text`
- 本文に `![alt](./local.png)` や `![](./local.webm)` があれば、同じパスを `--attach` したとき URL に書き換えられる
- 動画は段落をその参照だけにする（文中に混ぜるとリンクになる）

## Cursor Origin（upload_pull_request_attachment）

Origin ホストのリポジトリ向け。返ってきた `url` を本文に書く。

- 画像: `![alt](url)`
- 動画: URL を**単独行**
- 対応: 画像（gif/jpeg/jpg/png/webp、上限 10MB）/ 動画（mov/mp4/webm、上限 100MB）
- MCP リクエスト上限のため、実質 **約 750KB** まで。超える場合は圧縮するか `gh --attach` へ

## 振り分け

| 状況 | 方法 |
|------|------|
| Origin ホスト + ファイルが十分小さい | `upload_pull_request_attachment` |
| GitHub / 他エージェント / 大きいファイル | `gh … --attach` |

このリポジトリの `origin` は GitHub（`mafyyu/aruka`）なので、通常は `gh --attach`。

## capture.mjs

`@playwright/test` と `@clerk/testing` を devDependencies に入れた上で、npm script 経由で実行する。

```bash
npm run pr-media -- /scan /library

npm run pr-media -- --login /library

npm run pr-media -- --login --video --duration 8 /scan
```

### 構成

| ファイル | 役割 |
|----------|------|
| `capture.mjs` | CLI。引数を解析し、環境変数（`PR_MEDIA_*`）にして Playwright Test を起動する |
| `playwright.config.ts` | mobile / desktop の 2 プロジェクト、`.env.local` の読み込み |
| `global-setup.ts` | `--login` 時に Clerk テストユーザーでログインし、セッションを `.pr-media/.auth/user.json` に保存 |
| `capture.spec.ts` | パスごとのスクショ、または全パスを通しで撮る動画 |
| `manifest-reporter.ts` | 結果を `.pr-media/manifest.json` に書くカスタムレポーター |
| `lib.ts` | 設定・パス→ファイル名変換・ページを開く処理（リダイレクト検出）の共通部分 |

`.cursor/` 配下はアプリの tsconfig の対象外なので、Next.js のビルドには影響しない。

| オプション | 意味 | 既定 |
|------------|------|------|
| `--base URL` | アプリのベース | `http://localhost:3000` |
| `--out DIR` | 出力先 | `.pr-media` |
| `--video` | 短尺動画（viewport ごと） | off（スクショ） |
| `--duration SEC` | 動画の長さ（viewport あたり） | `8` |
| `--login` | Clerk テストユーザーでログインしてから撮る | off |

`--base=URL` のような `=` 形式も可。

位置引数の `/path` が撮影対象。省略時は `/`。

常に **mobile (390×844, isMobile / hasTouch / iPhone UA)** と **desktop (1280×720)** の両方を撮る。

- 1 件でも失敗すると exit code 1。詳細は `manifest.json`（Playwright の詳細ログは `.pr-media/.test-results/`）
- HTTP 4xx/5xx や別パスへのリダイレクト（未ログイン等）は失敗扱い
- `manifest.json` は実行ごとに追記（同じ `file` のエントリは置き換え）。各エントリに `capturedAt` が付く
