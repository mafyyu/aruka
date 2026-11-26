import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { AUTH_FILE, OPTS } from "./lib";

// Clerk の鍵やテストユーザーのメールアドレスを .env.local から読む
const envFile = path.resolve(".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);
// アプリ側は NEXT_PUBLIC_ で持っているので、@clerk/testing 用の名前にも流用する
process.env.CLERK_PUBLISHABLE_KEY ??=
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const VIEWPORTS = [
  {
    name: "mobile",
    use: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: devices["iPhone 13"].userAgent,
    },
  },
  {
    name: "desktop",
    use: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    },
  },
];

export default defineConfig({
  testDir: ".",
  testMatch: "capture.spec.ts",
  outputDir: path.join(OPTS.out, ".test-results"),
  globalSetup: "./global-setup.ts",
  retries: 0,
  timeout: 60_000 + OPTS.duration * 1000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["./manifest-reporter.ts"]],
  use: {
    browserName: "chromium",
    navigationTimeout: 30_000,
    storageState: OPTS.login ? AUTH_FILE : undefined,
  },
  projects: VIEWPORTS.map((vp) => ({
    name: vp.name,
    use: {
      ...vp.use,
      video: OPTS.video ? { mode: "on" as const, size: vp.use.viewport } : "off",
    },
  })),
});
