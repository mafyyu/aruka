#!/usr/bin/env node
/**
 * Usage:
 *   npm run pr-media -- /scan /library
 *   npm run pr-media -- --video --duration 8 /scan
 *
 * Requires `playwright` in devDependencies:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Always captures both mobile and desktop viewports.
 *
 * Options:
 *   --base URL       default http://localhost:3000
 *   --out DIR        default .pr-media
 *   --video          record short videos (one per viewport)
 *   --duration SEC   video length per viewport, default 8
 *
 * `--opt=value` form is also accepted.
 *
 * Exit code: 0 if every capture succeeded, 1 if any failed
 * (details in <out>/manifest.json).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

let playwright;
try {
  playwright = await import("playwright");
} catch (err) {
  if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
  console.error(
    "playwright が見つかりません。`npm i -D playwright && npx playwright install chromium` を実行してください。",
  );
  process.exit(1);
}
const { chromium, devices } = playwright;

const VIEWPORTS = [
  {
    name: "mobile",
    contextOptions: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: devices["iPhone 13"].userAgent,
    },
  },
  {
    name: "desktop",
    contextOptions: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    },
  },
];

const NAV_TIMEOUT_MS = 30_000;
// 常時ポーリングがあるページでも止まらないよう、networkidle は短時間だけ待つ
const IDLE_TIMEOUT_MS = 5_000;

const VALUE_FLAGS = new Set(["--base", "--out", "--duration"]);

function parseArgs(argv) {
  const opts = {
    base: "http://localhost:3000",
    out: ".pr-media",
    video: false,
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
    } else if (a === "--video") {
      opts.video = true;
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

/** "/books/1?tab=a" -> "books-1_tab_a" (ファイル名に使えない文字は "_" に) */
function slug(p) {
  if (p === "/") return "home";
  return p
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

function errorMessage(err) {
  return String(err?.message ?? err);
}

function normalizePath(u) {
  return u.pathname.replace(/\/+$/, "") || "/";
}

/**
 * ページを開き、エラー応答やリダイレクト（未ログインで /sign-in へ飛ばされる等）を失敗として扱う。
 */
async function open(page, p, base) {
  const requested = new URL(p, base);
  const res = await page.goto(requested.toString(), {
    waitUntil: "load",
    timeout: NAV_TIMEOUT_MS,
  });
  await page
    .waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS })
    .catch(() => {});
  if (res && res.status() >= 400) {
    throw new Error(`HTTP ${res.status()} for ${p}`);
  }
  const final = new URL(page.url());
  if (normalizePath(final) !== normalizePath(requested)) {
    throw new Error(
      `redirected to ${final.pathname}${final.search} (未ログインの可能性)`,
    );
  }
}

async function captureScreenshots(browser, opts, vp) {
  const entries = [];
  const context = await browser.newContext(vp.contextOptions);
  const page = await context.newPage();
  try {
    for (const p of opts.paths) {
      const file = path.join(opts.out, `${slug(p)}-${vp.name}.png`);
      const entry = { type: "screenshot", path: p, viewport: vp.name, file };
      try {
        await open(page, p, opts.base);
        await page.screenshot({ path: file, fullPage: true });
        entries.push({ ...entry, ok: true });
      } catch (err) {
        entries.push({ ...entry, ok: false, error: errorMessage(err) });
      }
    }
  } finally {
    await context.close();
  }
  return entries;
}

async function captureVideo(browser, opts, vp) {
  const file = path.join(
    opts.out,
    `flow-${opts.paths.map(slug).join("-")}-${vp.name}.webm`,
  );
  const entry = { type: "video", paths: opts.paths, viewport: vp.name, file };
  const context = await browser.newContext({
    ...vp.contextOptions,
    recordVideo: { dir: opts.out, size: vp.contextOptions.viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  const perPathMs = Math.max(1000, (opts.duration * 1000) / opts.paths.length);

  let error;
  try {
    for (const p of opts.paths) {
      await open(page, p, opts.base);
      await page.waitForTimeout(perPathMs);
    }
  } catch (err) {
    error = err;
  }
  await context.close();

  if (!error) {
    try {
      await video.saveAs(file);
    } catch (err) {
      error = err;
    }
  }
  // Playwright が付けたランダム名の元ファイルは成否に関わらず消す
  await video?.delete().catch(() => {});

  return error
    ? { ...entry, ok: false, error: errorMessage(error) }
    : { ...entry, ok: true };
}

/** 既存の manifest に追記する（同じ file のエントリは新しい結果で置き換え） */
async function writeManifest(out, entries) {
  const manifestPath = path.join(out, "manifest.json");
  let prev = [];
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    if (Array.isArray(parsed)) prev = parsed;
  } catch {
    // 初回 or 壊れている場合は作り直す
  }
  const files = new Set(entries.map((e) => e.file));
  const merged = [...prev.filter((e) => !files.has(e.file)), ...entries];
  await writeFile(manifestPath, JSON.stringify(merged, null, 2) + "\n");
  return manifestPath;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await mkdir(opts.out, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const capturedAt = new Date().toISOString();
  const entries = [];

  try {
    for (const vp of VIEWPORTS) {
      if (opts.video) entries.push(await captureVideo(browser, opts, vp));
      else entries.push(...(await captureScreenshots(browser, opts, vp)));
    }
  } finally {
    await browser.close();
  }

  const stamped = entries.map((e) => ({ ...e, capturedAt }));
  const manifestPath = await writeManifest(opts.out, stamped);
  console.log(JSON.stringify({ out: opts.out, captured: stamped }, null, 2));

  const failed = stamped.filter((e) => !e.ok);
  if (failed.length > 0) {
    console.error(
      `${failed.length} capture(s) failed. See ${manifestPath} for details.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
