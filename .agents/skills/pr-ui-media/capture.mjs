#!/usr/bin/env node
/**
 * PR 用のスクショ・動画を撮る CLI。中身は Playwright Test（playwright.config.ts）を起動するだけのラッパー。
 *
 * Usage:
 *   npm run pr-media -- /scan /library
 *   npm run pr-media -- --login /library
 *   npm run pr-media -- --video --duration 8 /scan
 *
 * Requires devDependencies:
 *   npm i -D @playwright/test @clerk/testing && npx playwright install chromium
 *
 * Always captures both mobile and desktop viewports.
 *
 * Options:
 *   --base URL       default http://localhost:3000
 *   --out DIR        default .pr-media
 *   --video          record short videos (one per viewport)
 *   --duration SEC   video length per viewport, default 8
 *   --login          sign in as the Clerk test user (E2E_CLERK_USER_EMAIL) first
 *
 * `--opt=value` form is also accepted.
 *
 * Exit code: 0 if every capture succeeded, 1 otherwise
 * (details in <out>/manifest.json).
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "playwright.config.ts",
);
const VALUE_FLAGS = new Set(["--base", "--out", "--duration"]);
const BOOL_FLAGS = new Set(["--video", "--login"]);

function parseArgs(argv) {
  const opts = {
    base: "http://localhost:3000",
    out: ".pr-media",
    video: false,
    login: false,
    duration: 8,
    paths: [],
  };
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    let value;
    if (a.startsWith("--") && a.includes("=")) {
      value = a.slice(a.indexOf("=") + 1);
      a = a.slice(0, a.indexOf("="));
    }
    if (VALUE_FLAGS.has(a)) {
      if (value === undefined) {
        value = argv[++i];
        if (value === undefined || value.startsWith("--")) {
          throw new Error(`${a} requires a value`);
        }
      }
      if (a === "--base") opts.base = value;
      else if (a === "--out") opts.out = value;
      else opts.duration = Number(value);
    } else if (BOOL_FLAGS.has(a)) {
      opts[a.slice(2)] = true;
    } else if (a.startsWith("/")) {
      opts.paths.push(a);
    } else {
      throw new Error(`Unknown arg: ${argv[i]}`);
    }
  }
  if (!Number.isFinite(opts.duration) || opts.duration <= 0) {
    throw new Error(`--duration must be a positive number (got ${opts.duration})`);
  }
  try {
    new URL(opts.base);
  } catch {
    throw new Error(`--base must be an absolute URL (got ${opts.base})`);
  }
  if (opts.paths.length === 0) opts.paths = ["/"];
  return opts;
}

function resolvePlaywrightCli() {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  try {
    return require.resolve("@playwright/test/cli");
  } catch {
    console.error(
      "@playwright/test が見つかりません。`npm i -D @playwright/test @clerk/testing && npx playwright install chromium` を実行してください。",
    );
    process.exit(1);
  }
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [resolvePlaywrightCli(), "test", "--config", CONFIG],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PR_MEDIA_BASE: opts.base,
      PR_MEDIA_OUT: path.resolve(opts.out),
      PR_MEDIA_PATHS: JSON.stringify(opts.paths),
      PR_MEDIA_VIDEO: opts.video ? "1" : "",
      PR_MEDIA_DURATION: String(opts.duration),
      PR_MEDIA_LOGIN: opts.login ? "1" : "",
    },
  },
);
child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
