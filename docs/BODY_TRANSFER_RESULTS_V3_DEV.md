# Body-transfer V3 Phase-D dev results — FROZEN DEV-NOGO (2026-10-28)

Single authorized dev run under `docs/BODY_TRANSFER_PLAN_V3.md`. No qual seeds touched.
Line CLOSED; no Phase Q, no second dev run, no qual bank drawn.

## Design recap
- Slow-direction anchor on the taste readout (Gen1 R=4 base + `slowAnchorRate=1e-3`,
  `slowAnchorStrength=λ`), N-body only, 4-history × 6-arm mains, 12-probe pressure
  battery + sham per history, alignment `cos(w_C, w_A)` from atA/atC anchors.
- Predeclared go-bar (best-λ by ΔA-ret): ΔA-ret ≥ +0.15 AND ΔB-ret ≥ −0.10 AND
  Δlevel ≥ −0.20 AND alignment strictly above control.

## Execution (corrected accounting)
- Bank `evidence/body-transfer/v3-dev/fresh-01/protocol.json` (36 unique fresh seeds,
  union-excluded; drawn once by the runner, first use = this run).
- Attempt `evidence/body-transfer/v3-dev/attempt-01/`: 12 rows, anchors
  A+C × 3 λ, ledger, `dev-results.json`.
- Spent: **72 mains + 156 probes = 228 executions**, 168960 world-ticks,
  4055040 founder-slots, **9788889008 scalar ops** (cap 90e9).
- CORRECTION to plan text: the plan wrote "68 probes (17×4)" per config, but the
  frozen pressure battery is 12 probes + sham = 13 executions/history (V2's
  per-body 17 was 13 + 4 early-A/B, which Phase D omits). Per config: 24 mains +
  52 probes = 76; total 228 ≤ frozen 276 ceiling. Estimands, bars, and decision
  rule unchanged; coming in under budget is not a scope change.
- One instrument correction post-execution, execution-logic untouched: terminal
  count constants 204→156 probes (and skip-check 16→12 probe keys). All 228
  executions had already completed with inline integrity checks (residual <1e-7,
  op caps). Scoring completed analytically via `--rescore` (zero new worlds);
  `dev-results.json` records execution vs scoring source manifests. Attempt and
  bank artifacts preserved unmodified.

## Results (raw retention, 4-history means; independently audited from rows+anchors)

| λ | A-ret | B-ret | level (cand−unlearned) | align cos(w_C,w_A) |
|---|---:|---:|---:|---:|
| 0 (control) | +0.215 | +0.628 | +6.169 | 0.701 |
| 0.02 | +0.036 | +0.139 | +5.838 | 0.712 |
| 0.08 | +0.036 | +0.139 | +5.838 | 0.743 |

Best-λ by ΔA: 0.02 (tie). ΔA = −0.179 (bar +0.15: FAIL), ΔB = −0.488 (bar −0.10:
FAIL), ΔL = −0.331 (bar −0.20: FAIL), alignment up (PASS — only bar met).
**Verdict: DEV-NOGO.**

## Mechanism note (descriptive, not a rescue)
- λ=0.02 vs 0.08: lifetime energy **bit-identical** in all 4 histories while
  readout weights differ by up to ~0.5 L∞ — the anchor moves weights below the
  greedy action-flip threshold (no behavior change) except where it flips
  actions, and those flips hurt both A- and B-retention. Rotation without a
  task-relevant direction prior distorts rather than protects.
- The alignment gain is near-definitional (the pull rotates w toward its own
  slow EMA), so it cannot rescue the three failed behavioral bars — exactly the
  failure mode the conjunctive bar was designed to catch.

## Decision
V3 line CLOSED at Phase D per the frozen rule. No Phase-Q qual bank drawn, no
qual executions spent, no RSI claim. Next untested axes remain: bigger-ruler
multi-bank replication (bank noise vs mechanism) and Option B
`localResourceSense` new-observation line (separately frozen protocol required).
