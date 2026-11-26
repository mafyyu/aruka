import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { MANIFEST_ANNOTATION, OPTS, type MediaMeta } from "./lib";

type Entry = MediaMeta & { ok: boolean; error?: string; capturedAt: string };

// エラーメッセージに含まれる ANSI カラーコードを除く
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

/**
 * 各テストの結果を .pr-media/manifest.json にまとめる。
 * 前回の結果には追記し、同じ file のエントリだけ新しい結果で置き換える。
 */
export default class ManifestReporter implements Reporter {
  private entries: Entry[] = [];
  private capturedAt = new Date().toISOString();

  onTestEnd(test: TestCase, result: TestResult): void {
    const annotations = [...(result.annotations ?? []), ...test.annotations];
    const meta = annotations.find((a) => a.type === MANIFEST_ANNOTATION);
    if (!meta?.description) return;

    const ok = result.status === "passed";
    const error = result.error?.message?.replace(ANSI, "").split("\n")[0];
    this.entries.push({
      ...(JSON.parse(meta.description) as MediaMeta),
      ok,
      ...(ok ? {} : { error: error ?? result.status }),
      capturedAt: this.capturedAt,
    });
  }

  async onEnd(): Promise<void> {
    if (this.entries.length === 0) return;
    const manifestPath = path.join(OPTS.out, "manifest.json");

    let prev: Entry[] = [];
    try {
      const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
      if (Array.isArray(parsed)) prev = parsed;
    } catch {
      // 初回 or 壊れている場合は作り直す
    }
    const files = new Set(this.entries.map((e) => e.file));
    const merged = [...prev.filter((e) => !files.has(e.file)), ...this.entries];
    await writeFile(manifestPath, JSON.stringify(merged, null, 2) + "\n");

    const failed = this.entries.filter((e) => !e.ok).length;
    console.log(
      `\npr-media: ${this.entries.length - failed} ok, ${failed} failed → ${manifestPath}`,
    );
  }

  printsToStdio(): boolean {
    return false;
  }
}
