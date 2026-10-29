# M-RELEARN Phase-A results — baselines (INCONCLUSIVE on criterion, rich descriptively)

Frozen plan: `docs/M_RELEARN_PLAN_V1.md`. Computed verdict per frozen
formula: `CEILING-PROOF` (go=false: all 12 episodes censored, medians null).
READ the computed label with §2: it is NOT a ceiling proof of speed — the
criterion is proven unreachable-in-context for ANY arm, so Phase A measured
context difficulty, not relearning speed. No Phase B (gate requires evidence
of SLOW relearning; none exists). Single licensed follow-up: V1a (§5).

## §1 What the frozen bars say (no reinterpretation of the computation)

- 12/12 reset episodes censored (`never-reached`): ticks-to-80%-of-own-A-max
  never achieved within either 512-tick episode. Medians null → gate
  (`median > 256`) NOT met → no intervention licensed. Ledger exact:
  24 mains / 0 probes / 43008 ticks / 1.03M slots / 3.80e9 ops (all caps).
  `redone: []` (no crash, no resume).

## §2 Why the criterion failed (context cap, proven from ledgered data)

- The never-wiped, fully-trained candidate ALSO never sustains 80%-of-A-max
  in B: best 2-sustained B-bin means 42.9–46.2 vs thresholds 51.4–51.6, all
  6 histories. In scarce C the ceiling is lower still (~21 phase means).
  NOBODY — trained or wiped — can satisfy the criterion in B/C. The bars
  measured the context cap, a relearning-independent fact.
- Formula blind spot (lesson learned, disclosed not patched): all-censored
  yields null medians, which the frozen formula reads as ceiling. The data
  say inconclusive-on-speed. The formula stands unrecomputed; this section
  is its documented correction.

## §3 What the curves actually show (descriptive, pre-registered categories)

- **Wipe costs nothing measurable, instantly.** Reset ≡ candidate from the
  FIRST post-wipe 32-tick bin in all 12 episodes (B bin16/17: e.g. 47.2/47.2;
  C bin32/33: e.g. 27.3/27.0). Upper bound on relearning cost: 32 ticks —
  or zero-weights+greedy ≡ trained policy here (M-ORIGIN's echo).
- **Policy differences manifest under scarcity, not abundance.** Phase-A
  means: candidate ~55 vs unlearned ~54 (indistinguishable); B: ~36 vs ~31;
  C: ~19 vs ~12; return-A: ~11 vs ~5. Learning matters exactly when the
  ecology is hard.
- **return-A does not snap back** (bins 48–55 ≈ 10–15 vs phase-A ≈ 55, all
  arms): no evidence of retained memory re-expressing; depletion dominates.
  Frozen B/C decay as expected (no learning → tracks unlearned downward).

## §4 Licensed follow-up (proposal ONLY — needs V1a + fresh goal; no worlds here)

**V1a: fresh-bank re-measurement with per-tick curves stored raw + same-context
criterion** (X% of candidate same-bin level; death guard retained). Single
attempt, same envelope, new seed range (384001–384054 spent — never
regenerate). Rationale: the practical question is now precisely scoped
(wipe cost ∈ [0,32) ticks) and the confound is understood; a same-context
criterion is reachable by construction. If V1a ALSO finds instant
convergence, the ceiling claim becomes real and the line closes for good.
No intervention family is licensed (nothing slow was observed).
