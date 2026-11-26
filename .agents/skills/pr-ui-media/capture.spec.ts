import path from "node:path";
import { test } from "@playwright/test";
import { annotate, open, OPTS, slug } from "./lib";

test.beforeEach(async ({ page }) => {
  if (!OPTS.login) return;
  // ボット対策をすり抜けるための Testing Token をページごとに設定する
  const { setupClerkTestingToken } = await import("@clerk/testing/playwright");
  await setupClerkTestingToken({ page });
});

if (OPTS.video) {
  test("video", async ({ page }, testInfo) => {
    const viewport = testInfo.project.name;
    const file = path.join(
      OPTS.out,
      `flow-${OPTS.paths.map(slug).join("-")}-${viewport}.webm`,
    );
    annotate(testInfo, { type: "video", paths: OPTS.paths, viewport, file });

    const perPathMs = Math.max(
      1000,
      (OPTS.duration * 1000) / OPTS.paths.length,
    );
    for (const p of OPTS.paths) {
      await open(page, p);
      await page.waitForTimeout(perPathMs);
    }

    const video = page.video();
    if (!video) throw new Error("video recording is not enabled");
    // 動画はページを閉じた時点で確定する
    await page.close();
    await video.saveAs(file);
  });
} else {
  for (const p of OPTS.paths) {
    test(`screenshot ${p}`, async ({ page }, testInfo) => {
      const viewport = testInfo.project.name;
      const file = path.join(OPTS.out, `${slug(p)}-${viewport}.png`);
      annotate(testInfo, { type: "screenshot", path: p, viewport, file });

      await open(page, p);
      await page.screenshot({ path: file, fullPage: true });
    });
  }
}
