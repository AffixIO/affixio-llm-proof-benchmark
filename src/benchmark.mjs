import { mkdir, writeFile } from "node:fs/promises";

const count = Number(process.env.PROOF_COUNT ?? 15000);
const target = Number(process.env.TARGET_VERIFIED ?? 5000);
const endpoint = process.env.AFFIXIO_VERIFY_URL;
const apiKey = process.env.AFFIXIO_API_KEY;
const llm = process.env.LLM_NAME ?? "unspecified-model";
const concurrency = Number(process.env.CONCURRENCY ?? 20);

if (!Number.isInteger(count) || count < 1) throw new Error("PROOF_COUNT must be a positive integer");
if (!endpoint) throw new Error("AFFIXIO_VERIFY_URL is required");
if (!apiKey) throw new Error("AFFIXIO_API_KEY is required and must be supplied outside the repository");

const startedAt = new Date().toISOString();
let verified = 0;
let rejected = 0;
let failed = 0;
const samples = [];

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) throw new Error("CONCURRENCY must be an integer from 1 to 100");
let next = 0;
const worker = async () => {
  while (true) {
    const index = next++;
    if (index >= count) return;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ benchmark_case: index + 1, llm })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) failed += 1;
      else if (body.verified === true || body.valid === true) verified += 1;
      else rejected += 1;
      if (samples.length < 10) samples.push({ case: index + 1, status: response.status, verified: body.verified ?? body.valid ?? false });
    } catch {
      failed += 1;
    }
  }
};
await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker));

const report = { startedAt, finishedAt: new Date().toISOString(), proofCount: count, concurrency, verified, rejected, failed, targetVerified: target, targetReached: verified >= target, llm, endpoint, samples };
await mkdir("reports", { recursive: true });
const path = `reports/run-${startedAt.replaceAll(/[:.]/g, "-")}.json`;
await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ proofCount: count, verified, rejected, failed, targetVerified: target, targetReached: report.targetReached, llm, report: path }, null, 2));
