# TURN-GATE plan V1 (replicate cue-conditioned turning, then intervene)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Child of CUE-DISCRIMINATE (NOGO on the pause metric; turn-gating found
post-hoc, explicitly UNCLAIMED there). This line re-tests it properly:
pre-registered turn metric, fresh bank, conjunctive bars.

## Why (CUE post-hoc, motivation only — not evidence)

CUE attempt-01 ledgered, per-history: candidate turn|harmful 0.85–0.88
(n≈10k each) vs turn|beneficial 0.049–0.051; unlearned 0.049–0.050 vs
0.046–0.051 (flat). Pause rates were flat 0.27–0.28 everywhere (the frozen
metric correctly failed). If turning replicates on a fresh bank, the
foraging-choice mechanism is cue-gated turning (not pausing), and V1b
intervenes on it.

## Bank + runs (fresh, union-excluded)

- Dev bank `evidence/turn-gated-dev/fresh-01/`: deterministic 395019–395072
  (6 histories × 9), verified clean in all namespaces (no test/script/doc
  literals, no evidence seed-keys), `fixture-seeds-01.json` post-build.
- 2 arms (candidate learns / unlearned never learns) × 6 histories =
  12 mains, ZERO probes, BT ecology, N body, 1792 ticks.
- Same join collector as CUE (decision{cue,action} + physical{beneficial,
  harmful} per tick/agent — NO new engine code; behavior-identical recording
  emit, proven).

## Bars (conjunctive Phase-A GO; any fail closes the line, no V1b)

- G1 integrity: join rate ≥ 0.99 on every run, else INVALID (instrument).
- G2 replication (pre-registered turn metric): (a) candidate
  turn|harmful − turn|beneficial ≥ 0.5 on ≥4/6 histories; (b) unlearned
  |turn|harm − turn|ben| < 0.1 on ≥4/6 histories (control must stay flat —
  proves the effect is learning-dependent, not ecological). Both required.
- V1b gate (ONLY on GO): propose turn-conditioned avoidance training
  (fresh plan + fresh goal + fresh bank). No V1b designed here.
- G3 caps: ≤300 exec (expects 12 mains) / ≤20e9 ops / ≤3600s wall.
- G4 triage: collector/scorer fixtures green (synthetic streams; new
  bank-agnostic), bank build smoke via module import, full suite green.

## Not included (unchanged)

No rescoring of CUE (its numbers motivated this line; they cannot confirm
it). No qual. No second attempt. No intervention in Phase A (measurement
only — V1b is a proposal, never an execution, under this plan).
