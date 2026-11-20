# MATE-SOCIAL RESULTS V2 — conditional copying fails too (NOGO, line CLOSED)

Date: 2026-11-02. Plan: `docs/MATE_SOCIAL_PLAN_V2.md` (FROZEN, design only).
Implement: `49613c9` (copyconditional engine knob: maiden-line gate +
most-recent-success donor, frozen fallback chain, zero new billed ops,
restore round-trip + 14/14 fixtures + fresh-02 bank 443001–443054).
Attempt-02 (single, authorized): 18 mains / 0 probes / 32256 worldTicks /
774144 founderSlots / 3.55e9 ops. Ledger exact, `redone: []`, G1+G2 true.

## Verdict: MATE-SOCIAL-NOGO-V2

Conditional copying does not lift compounding: copycond gen-2 = 3 vs
maternal gen-2 = 5 (bar met at ≥2, direction fails). The copy-rule is
exonerated — even the theorists' conjunction (uncertainty-gated +
recency-weighted) changes nothing. Bottleneck stands: encounters, not
transmission. Line CLOSED (no V3 without new rationale).

## Per-arm totals (6 histories each)

- copycond (conditional + recency): births 29, gen-1 26, gen-2 3
  per-seed gen-2 [1,1,0,0,0,1] (seeds 443001…443046).
- copyalways (V1-exact unconditional): births 28, gen-1 27, gen-2 0
  per-seed gen-2 [0,0,0,0,0,0] — V1 directionally replicated (unconditional
  copying adds nothing; here it adds less than nothing).
- maternal (null control): births 36, gen-1 30, gen-2 5
  per-seed gen-2 [4,0,0,0,0,1] — concentrated on seed 443001 (4/5).

## Mechanism read (descriptive, non-gating)

- The gate fired as designed (maiden lines copied donors; proven lines
  kept maternal — fixture-verified logic, live-bank behavior consistent:
  copycond births/gen-1 track maternal closely, 29/26 vs 36/30).
- copyalways = 0 vs V1's 1 = 1: the unconditional null not only replicated,
  it hardened. Copying best-founder policy is now 0-for-2 across banks
  (V1: 1v1, V2: 0v5) — the strongest statement the program can make that
  the copy rule is not the bottleneck.
- Maternal's 5 is itself one-seed concentrated (443001: 4/5) — the familiar
  V1b/ML1 pattern: bank-level variation dominates, mechanism-level signal
  is absent. No arm shows broad-based compounding (best spread: copycond
  3 seeds × 1).
- Per frozen plan no caveat is triggered (copyalways did NOT beat maternal),
  so the verdict needs no asterisk: conditional copying was tested fairly
  and failed cleanly. The R82/R116 conjunction is exhausted as a rescue
  hypothesis for this substrate.
- firstMatingTick: unshifted across arms (7th bank running with identical
  per-seed timing — the program's most replicated null; timing data in
  dev-results).

## Arc position

Mating arc: copy mechanisms (exact, mutant-jitter, best-founder, conditional-
recent, recombined) all fail to lift compounding above maternal on every
fresh bank, while hub-vs-spread geography and bar-setting dominate every
verdict. The transmission-mechanism space is now closed twice over (V1
unconditional + V2 conditional), with the recency dimension explicitly
spent. Remaining licensed frontiers are unchanged (sex-conditioned leaving,
detection-sharing, differentiation-first, fear ecology, load-then-recombine —
each needs fresh rationale + frozen plan + fresh bank). No RSI claim.
Cumulative program spend: 7959 (+18 ledgered).
