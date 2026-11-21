#!/usr/bin/env node
/**
 * Usage:
 *   npm exec --yes --package=playwright -- node .cursor/skills/pr-ui-media/capture.mjs /scan /library
 *   ... capture.mjs --video --duration 8 /scan
 *
 * Always captures both mobile and desktop viewports.
 *
 * Options:
 *   --base URL       default http://localhost:3000
 *   --out DIR        default .pr-media
 *   --video          record short videos (one per viewport)
 *   --duration SEC   video length per viewport, default 8
 */
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 },
  { name: "desktop", width: 1280, height: 720, deviceScaleFactor: 1 },
];

function parseArgs(argv) {
  const opts = {
    base: "http://localhost:3000",
    out: ".pr-media",
    video: false,
    duration: 8,
    paths: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") opts.base = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (a === "--video") opts.video = true;
    else if (a === "--duration") opts.duration = Number(argv[++i]);
    else if (a.startsWith("/")) opts.paths.push(a);
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (opts.paths.length === 0) opts.paths = ["/"];
  return opts;
}

function slug(p) {
  return p === "/" ? "home" : p.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");
}

async function captureScreenshots(browser, opts, vp, manifest) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
  });
  const page = await context.newPage();
  for (const p of opts.paths) {
    const url = new URL(p, opts.base).toString();
    const file = path.join(opts.out, `${slug(p)}-${vp.name}.png`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.screenshot({ path: file, fullPage: true });
      manifest.push({
        type: "screenshot",
        path: p,
        viewport: vp.name,
        file,
        ok: true,
      });
    } catch (err) {
      manifest.push({
        type: "screenshot",
        path: p,
        viewport: vp.name,
        file,
        ok: false,
        error: String(err?.message ?? err),
      });
    }
  }
  await context.close();
}

async function captureVideo(browser, opts, vp, manifest) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    recordVideo: {
      dir: opts.out,
      size: { width: vp.width, height: vp.height },
    },
  });
  const page = await context.newPage();
  try {
    for (const p of opts.paths) {
      const url = new URL(p, opts.base).toString();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(
        Math.max(1000, (opts.duration * 1000) / opts.paths.length),
      );
    }
  } catch (err) {
    await context.close();
    manifest.push({
      type: "video",
      paths: opts.paths,
      viewport: vp.name,
      ok: false,
      error: String(err?.message ?? err),
    });
    return;
  }
  const video = page.video();
  await context.close();
  const rawPath = await video.path();
  const dest = path.join(
    opts.out,
    `flow-${opts.paths.map(slug).join("-")}-${vp.name}.webm`,
  );
  await rename(rawPath, dest);
  manifest.push({
    type: "video",
    paths: opts.paths,
    viewport: vp.name,
    file: dest,
    ok: true,
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await mkdir(opts.out, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  try {
    for (const vp of VIEWPORTS) {
      if (opts.video) await captureVideo(browser, opts, vp, manifest);
      else await captureScreenshots(browser, opts, vp, manifest);
    }
  } finally {
    await browser.close();
  }

  const manifestPath = path.join(opts.out, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ out: opts.out, manifest }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
