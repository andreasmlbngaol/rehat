/**
 * Uji beban ringan tanpa dependensi tambahan.
 *
 * Contoh:
 *   LOAD_TEST_URL=https://rehat-staging.vercel.app \
 *   LOAD_TEST_REQUESTS=60 LOAD_TEST_CONCURRENCY=4 \
 *   bun run load:test
 *
 * Skrip ini tidak melakukan login dan hanya menyentuh endpoint publik.
 */
const baseUrl = process.env.LOAD_TEST_URL ?? "http://localhost:3000";
const total = Number(process.env.LOAD_TEST_REQUESTS ?? 50);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? 5);
const paths = (process.env.LOAD_TEST_PATHS ?? "/,/api/v1/services")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

if (!Number.isFinite(total) || total <= 0) {
  throw new Error("LOAD_TEST_REQUESTS harus bilangan positif.");
}
if (!Number.isFinite(concurrency) || concurrency <= 0) {
  throw new Error("LOAD_TEST_CONCURRENCY harus bilangan positif.");
}

type Sample = { path: string; status: number; durationMs: number };

async function hit(path: string): Promise<Sample> {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "User-Agent": "rehat-load-test" },
    });
    await response.arrayBuffer();
    return { path, status: response.status, durationMs: performance.now() - started };
  } catch {
    return { path, status: 0, durationMs: performance.now() - started };
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index]!;
}

async function main() {
  console.log(`Target      : ${baseUrl}`);
  console.log(`Permintaan  : ${total} (konkurensi ${concurrency})`);
  console.log(`Path        : ${paths.join(", ")}\n`);

  for (const path of paths) await hit(path);

  const samples: Sample[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < total) {
      const index = cursor++;
      const path = paths[index % paths.length]!;
      samples.push(await hit(path));
    }
  }

  const started = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, () => worker()),
  );
  const elapsed = (performance.now() - started) / 1000;

  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const failed = samples.filter((sample) => sample.status < 200 || sample.status >= 400);
  const serverErrors = samples.filter((sample) => sample.status >= 500);

  console.log(`Selesai     : ${elapsed.toFixed(2)} detik`);
  console.log(`RPS         : ${(samples.length / elapsed).toFixed(2)}`);
  console.log(`Gagal       : ${failed.length}/${samples.length} (5xx: ${serverErrors.length})`);
  console.log(`p50         : ${percentile(durations, 50).toFixed(0)} ms`);
  console.log(`p95         : ${percentile(durations, 95).toFixed(0)} ms`);
  console.log(`p99         : ${percentile(durations, 99).toFixed(0)} ms`);
  console.log(`maks        : ${durations.at(-1)?.toFixed(0) ?? 0} ms`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

await main();

export {};
