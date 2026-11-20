# TURN-GATE Results V1b — cross-history transfer (single authorized attempt)

Date: 2026-10-30. Plan: `docs/TURN_GATE_PLAN_V1B.md` + `docs/TURN_GATE_PLAN_V1B_AMENDMENT_A1.md`
(both frozen before execution). Bank: `evidence/turn-gated-dev/fresh-02/` (fresh,
6 histories, seeds 407001–407054, union-excluded incl. 406xxx reserve).
Evidence: `evidence/turn-gated-dev/attempt-02/` (protocol, attempt, ledger,
9 rows, dev-results).

## Verdict: PHASE-B-GO

Conjunctive gates (pre-registered; descriptive, no RSI claim):

- **G1 transplant-integrity 9/9 PASS** — join 1.00 on all 9 mains (row
  `joinRate` exactly 1 everywhere); id-sets equal, digests equal,
  founder count 24.
- **G0 training gate PASS** — train gaps 0.8128 / 0.8239 / 0.8170, all ≥ 0.5
  (replicates V1's 0.81–0.83 on fresh bank: learning itself is solid).
- **G2a transferred mean gap 0.5779 ≥ 0.3 PASS** — per-pair 0.5178 / 0.5469 /
  0.6689 (all three pairs independently above bar).
- **G2b unlearned flat PASS** — gaps −0.0006 / +0.0010 / +0.0023, all |·| ≤ 0.1.

Ledger (exact): **9 mains, 0 probes, 16128 worldTicks, 387072 founderSlots,
1.42e9 scalarOperations** — within all caps (≤300 exec, ≤20e9 ops, ≤3600s).
`redone: []` (no crash recomputation).

## Provenance (dual, per crash-resume provision)

The first invocation completed all 9 mains then crashed on a one-token
NameError in post-run bookkeeping (aggregate wall-cap assert referenced
`T_WALL_CAP_SECONDS` instead of `T2_WALL_CAP_SECONDS`; per-row timing used
correct names). Fix committed separately (`97e69f6`); resume with
`resume:true` skipped all 9 complete rows (**zero new worlds**) and wrote
scoring. `dev-results.json` carries both hashes: `executionSources` =
pre-fix instrument (`f519c952…`), scoring under post-fix. The 9 rows are
byte-identical valid under both (fix touches no run-loop code). Single
authorized attempt preserved: no row was recomputed, no bank seed re-spent.

Per-pair runtime fields read 0s (resume-skip artifact); aggregate wall is
bounded by single-invocation completion, far under the 3600s cap; no timing
gate exists, so the verdict is unaffected. Noted, not hidden.

## Reading (descriptive only)

Same-agent carried weights transfer cue-conditioned turning to a new
codebook (6-7 flipped decisive cues) with a **transfer tax ≈ 0.2–0.3**
(train 0.81–0.82 → transferred 0.52–0.67) while unlearned stays flat (≈0).
Transfer is real, partial, and consistent across all three pairs. Any claim
beyond the gate (mechanism of the tax, per-cue attribution) needs its own
frozen line; this result licenses V1c (held-out-valence probe on 406xxx)
but does not pre-run it.
