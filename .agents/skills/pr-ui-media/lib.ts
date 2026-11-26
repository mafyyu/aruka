import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";

/**
 * capture.mjs から環境変数で渡される設定。
 * Playwright Test は独自の CLI 引数を受け取れないため、env 経由で受け渡す。
 */
export const OPTS = {
  base: process.env.PR_MEDIA_BASE || "http://localhost:3000",
  out: path.resolve(process.env.PR_MEDIA_OUT || ".pr-media"),
  paths: JSON.parse(process.env.PR_MEDIA_PATHS || '["/"]') as string[],
  video: process.env.PR_MEDIA_VIDEO === "1",
  duration: Number(process.env.PR_MEDIA_DURATION || 8),
  login: process.env.PR_MEDIA_LOGIN === "1",
};

/** ログイン済みセッションの保存先（.pr-media/ ごと gitignore 済み） */
export const AUTH_FILE = path.join(OPTS.out, ".auth", "user.json");

export const MANIFEST_ANNOTATION = "pr-media";

export type MediaMeta =
  | { type: "screenshot"; path: string; viewport: string; file: string }
  | { type: "video"; paths: string[]; viewport: string; file: string };

/** "/books/1?tab=a" -> "books-1_tab_a" (ファイル名に使えない文字は "_" に) */
export function slug(p: string): string {
  if (p === "/") return "home";
  return p
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

/** レポーターが manifest に書けるよう、撮影内容をテストに記録する */
export function annotate(testInfo: TestInfo, meta: MediaMeta): void {
  testInfo.annotations.push({
    type: MANIFEST_ANNOTATION,
    description: JSON.stringify(meta),
  });
}

function normalizePath(u: URL): string {
  return u.pathname.replace(/\/+$/, "") || "/";
}

// 常時ポーリングがあるページでも止まらないよう、networkidle は短時間だけ待つ
const IDLE_TIMEOUT_MS = 5_000;

/**
 * ページを開き、エラー応答やリダイレクト（未ログインでサインイン画面へ飛ばされる等）を失敗として扱う。
 */
export async function open(page: Page, p: string): Promise<void> {
  const requested = new URL(p, OPTS.base);
  const res = await page.goto(requested.toString(), { waitUntil: "load" });
  await page
    .waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS })
    .catch(() => {});
  if (res && res.status() >= 400) {
    throw new Error(`HTTP ${res.status()} for ${p}`);
  }
  const final = new URL(page.url());
  if (normalizePath(final) !== normalizePath(requested)) {
    const hint = OPTS.login
      ? "テストユーザーの権限やログイン状態を確認"
      : "未ログインの可能性。--login を付けて再実行";
    throw new Error(
      `redirected to ${final.pathname}${final.search} (${hint})`,
    );
  }
}
