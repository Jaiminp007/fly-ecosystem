# RANK-STABILITY AUDIT V1: gaps track energetics (+0.65); log adds nothing on this range

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/turn-gated-dev/attempt-*/dev-results.json
per-seed transGaps + matched transferred/unlearned endpoint
energies (30 test seeds, 10 banks). Executes the R220-queued
rank-stability item. NO gate change (pre-registered in R220).

## Findings

1. **Rank-stability is automatic (analytic).** Log is monotone;
   ranks cannot change under monotone rescaling. The queued
   question dissolves as posed — filed as the audit's first
   result (the question contained its answer).
2. **Gaps track energetics (+0.650, n=30).** Bigger correctness
   gaps come with bigger energy savings (transferred minus
   unlearned, matched histories). The bands are energetically
   meaningful: a deployed +0.13 gap means real energy saved
   (~2–6 units/season), not just correct turning. Linear and
   log forms indistinguishable here (|r| 0.650 vs 0.653 —
   ratios span only 0.86–0.97, where log ≈ linear).
3. **Learning always pays energetically (30/30 positive dE,
   +0.8 to +8.8).** Every transferred agent out-survives its
   unlearned twin on energy — the behavior is adaptive, not
   merely correct. Descriptive (frozen rows); not a new gate
   (energy was never gated, stays ungated).
4. **The Richter question stays open empirically.** Linear
   vs log needs wider energetic variation than this range
   provides (all deficits, narrow band). No gate change
   either way (pre-registered): bands stay linear by
   convention until evidence — not analogy — moves them.

## Verdict (measurement — queued item EXECUTED)

- LICENSED: gap–energy tracking (+0.65); universal
  energetic benefit (30/30); rank-stability triviality.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
