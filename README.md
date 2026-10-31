# AffixIO LLM proof benchmark

This repository is a small, reproducible harness for testing proof verification in an LLM-assisted workflow. It is deliberately written as a measurement project, not a product claim.

The default plan processes 15,000 proof records and reports the actual number accepted by the configured AffixIO verification endpoint. It does not force the result to 5,000. `TARGET_VERIFIED=5000` is a comparison target only. A report may say that the target was missed, met, or exceeded.

The LLM name is metadata. The harness never claims an LLM made a decision unless an adapter supplies that decision. This keeps proof verification separate from model output: the model can propose a case, while the verification service returns the recorded result.

## Run

```bash
cp .env.example .env
# Set AFFIXIO_API_KEY in the environment. Do not commit it.
AFFIXIO_API_KEY=... npm run run
```

The runner writes a JSON report to `reports/` and prints a short human-readable summary. It sends only the fields required by the configured endpoint. Replace the endpoint and request mapping with the exact SDK contract before a production run.

## Safety and interpretation

- No credential is included in source, issues, examples, or CI logs.
- The verification count is derived from responses, not a preset value.
- Proof verification is not the same as proving an LLM is correct.
- The benchmark should be run with a budget, rate limit, and written approval for the 15,000-request volume.
- Model names and results must be reported exactly as run, including failures and timeouts.
