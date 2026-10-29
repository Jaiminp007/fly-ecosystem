# M-RELEARN plan amendment V1a (fresh-bank re-measurement, per-tick curves, same-context criterion)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-A′ attempt (this amendment IS the second Phase-A run
the V1 RESULTS licensed — same objective, confound fixed). Everything not
changed here inherits V1 (caps, arms, discipline, resume terms, non-inclusions).

## Why (diagnosed, not guessed)

Phase A proved its own criterion unreachable-in-context (even the never-wiped
candidate never sustains 80%-of-A-max in B/C) and its 32-tick bins too coarse
(reset≡candidate from bin 1 → wipe cost ∈ [0,32) ticks, unmeasured). The fix:
same-context reference (candidate same-tick level — reachable by construction
wherever reset converges) + per-tick resolution (raw curves stored, not
pre-binned). No new machinery: same emit tap, finer storage.

## Changes (frozen)

1. **Bank**: fresh deterministic 385001–385054 (6 histories × 9), union-excluded
   (384001–384054 now spent + all prior). `fixture-seeds-01.json` post-build.
2. **Curves stored RAW per tick**: per arm per history, per tick: {mean
   own.energy, n} over that tick's observe records (n = alive founders that
   tick). 1792 ticks × 2 numbers — no pre-binning, no information loss.
   (Per-founder series NOT stored — means+n suffice for the frozen criterion;
   founder-level analysis stays out of scope.)
3. **Criterion (replaces V1's)**: per reset episode (B: 512–1023, C: 1024–1535),
   first tick t with t..t+7 ALL satisfying [reset_mean(t+i) ≥ 0.8 ×
   candidate_mean(t+i) AND n_reset ≥ 12 AND n_candidate ≥ 12]; ticks = t −
   episode start; censored at 512 if never. DEATH GUARD retained (the ≥12
   clauses ARE the guard, per-tick now). Reference is same-context by
   construction: wherever reset converges to candidate, the bar is reachable.
4. **Verdict rule (replaces V1 gate)**: median over uncensored episodes
   (+ censor rate reported): median ≤ 64 → CEILING proven FOR REAL
   (relearning at/below old resolution floor) → line CLOSED, publish.
   Median > 64 → GAP measured → V1b amendment picks ONE of V1's 4 frozen
   families (exploration scheduling / plasticity / primer-transfer /
   anti-rehearsal) with conjunctive bars. Censor-rate 100% again → design
   failed twice → close line, publish the failure (no V1b).
5. **Reported (not gating)**: frozen B/C decay, candidate ceiling, unlearned
   floor, return-A rebound (same categories, per-tick curves now), phaseRows.

## Explicitly not changed

4 arms (candidate/unlearned/frozen/reset) × 6 histories = 24 mains, zero
probes, same ecology/options; caps ≤300 exec / ≤20e9 ops / ≤3600s / ≤200MB
(expects ≈24 exec / ≈1.5e9); G5 (suite + dev-script smoke) before worlds;
single attempt; crash-resume only under V1d terms; no qual; no rescoring.
