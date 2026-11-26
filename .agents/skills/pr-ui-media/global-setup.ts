import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { AUTH_FILE, OPTS } from "./lib";

/**
 * --login 指定時だけ、Clerk のテストユーザーでログインしてセッションを保存する。
 * global setup はテスト用ワーカーを起動する前にメインプロセスで動くため、
 * clerkSetup() が設定する環境変数（Testing Token）が各ワーカーに引き継がれる。
 */
export default async function globalSetup(): Promise<void> {
  await mkdir(OPTS.out, { recursive: true });
  if (!OPTS.login) return;

  const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
  if (!emailAddress) {
    throw new Error(
      "E2E_CLERK_USER_EMAIL が未設定です。.env.local に Clerk テストユーザーのメールアドレスを設定してください。",
    );
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      "CLERK_SECRET_KEY が未設定です。.env.local に Clerk 開発用インスタンスの鍵を設定してください。",
    );
  }

  const { clerk, clerkSetup, setupClerkTestingToken } = await import(
    "@clerk/testing/playwright"
  );
  await clerkSetup();

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await setupClerkTestingToken({ page });
    // Clerk が読み込まれる公開ページを開いてからログインする
    await page.goto(new URL("/", OPTS.base).toString());
    await clerk.signIn({ page, emailAddress });
    await mkdir(path.dirname(AUTH_FILE), { recursive: true });
    await page.context().storageState({ path: AUTH_FILE });
  } finally {
    await browser.close();
  }
}
