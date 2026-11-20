# CUE-DISCRIMINATE plan V1 (foraging choice, not retention)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Licensed by F-RISK (unlearned eats ~½ harmful vs trained ~⅓, 8/8 histories).
This line tests CHOICE, not retention — no pull/anchor/gating of any closed
kind is involved. Single Phase-A attempt (measurement + gate); Phase B only
via V1b (frozen intervention).

## Why now (verified read-only 2026-10-29, zero new worlds)

The full per-decision foraging context ALREADY flows through the emit
stream — NO new emitter needed (F-RISK's anticipated requirement is OBE):
decision records carry `{tick, agentId, cue[4], action}` (contactObservation
returns the sensed cue vector; spread into `own`); physical records carry
`{tick, agentId, beneficialEaten, harmfulEaten, ...}` per tick; observe
records carry per-tick energy. A dev-script collector joining on
tick+agentId reconstructs cue → action → outcome for every decision.

## Bank + runs (fresh, union-excluded)

- Dev bank `evidence/cue-discrimination-dev/fresh-01/`: deterministic
  386001–386054 (6 histories × 9), `fixture-seeds-01.json` post-build
  (V1c ordering lesson). Union-excludes all prior banks/ranges/test tokens.
- 24 mains (candidate/unlearned/frozen/reset × 6 histories, BT ecology,
  body N, BT_TICKS=1792), ZERO probes (choice is main-phase behavior).
  Collector on ALL mains (recording-emit is behavior-identical per D1 tests).

## Bars (conjunctive Phase-A gate)

- G1 integrity: decision↔physical join rate ≥99% of decision ticks; else
  INVALID (instrument problem, not a verdict) — no second attempt without
  a V1a fix plan.
- G2 choice gap (fresh-bank replication + mechanism): (a) candidate
  harmful-share of intake < unlearned by ≥0.15 on ≥4/6 histories (F-RISK
  replication on fresh data); (b) cue-conditioned structure: per distinct
  contacted cue vector (labeled harmful/beneficial by majority subsequent
  intake), trained pause/turn rate on harmful-labeled contacts exceeds that
  on beneficial-labeled contacts — i.e., avoidance is cue-GATED, not just
  less eating overall. Both (a) AND (b) required for GO.
- V1b gate (pre-registered): GO iff trained harmful share still ≥0.25
  (room to improve) OR block-1 (ticks 0–511) harmful share ≥0.35 (slow to
  learn discrimination). ELSE (trained near-floor ≤0.10 fast): close with a
  ceiling proof — choice learning is already optimal here.
- G3 caps: ≤300 exec / ≤20e9 ops / ≤3600s wall / ≤200MB (expects ≈24 mains
  ≈1e9 ops). G4 triage: full suite green (6 shifted-pristine only) + dev
  collector smoke on synthetic streams BEFORE any world (no engine changes,
  so no new fixtures — smoke covers the new code path).

## Phase B (V1b picks ONE — cue-conditioned avoidance training vs
exploration scheduling — with its own conjunctive bars; frozen later)

## Not included (unchanged)

No new emitter (verified unnecessary); no qual/reserve contact; no bank
reuse; no rescoring; no RSI; no second attempt per phase (crash-resume only
under V1d terms: bank SHA, dual provenance, redone disclosure, ledger-exact).
On GO: Phase-Q proposal separate. On NOGO/ceiling: close, publish.
