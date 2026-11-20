# IB-FRONTIER V1 — RESULTS (read-only measurement, zero new worlds)

**Outcome: the learned policy's effective cue alphabet is TWO.** Candidate
I(action; cue-identity) = 0.5763 bits vs I(action; valence) = 0.5753 bits —
gap **0.0010 bits** (< 0.05 pre-registered band → valence-sufficient). k95 = k99 = 2:
two clusters (harmful/beneficial) retain ≥99% of all action information across 72
(history, cue) units. All cue-specific rate variation is noise. Unlearned:
identity 0.0003 bits, degenerate-flagged (fractions of Laplace floor, not structure).
No gates, no verdict, no claim beyond the numbers. Cumulative spend: unchanged.

## Data & method (frozen, untouched)

Same 12 frozen TURN-GATE V1 rows as MAXENT-V1. Identity unit is (history, cue-bits)
— required, because per-history codebooks remap bits→valence (label drift detected
at freeze: same bits, different valence across histories; pooling by bits alone
would conflate). 72 units total. Agglomerative rate clustering k=72..1, Laplace
α=1/cell (same prior as MAXENT-V1); monotonicity holds to 1e-3 (smoothing-scale
violations ≤2.8e-5 documented, tolerance justified in code).

## Numbers

| arm | units | I(identity) | I(valence) | gap | k95 | k99 | degenerate |
|---|---|---|---|---|---|---|---|
| candidate | 72 | 0.5763 | 0.5753 | 0.0010 | 2 | 2 | false |
| unlearned | 72 | 0.0003 | 0.0000 | 0.0003 | 6 | 10 | TRUE (floor fractions) |

- Valence I reuses MAXENT-V1's computation path; equality with 0.5753/0.0000
  asserted to 1e-9 in execution (schema-drift guard — passed).
- The policy discriminates valence and nothing else: 70 of 72 units' worth of cue
  granularity carries 0.0010 bits (0.2% of total). The QD-map HB-heterogeneity
  (cue-level rate variation) is therefore acquisition noise the policy does NOT act
  on — consistent with greedy thresholding on a valence estimate, not cue memory.
- Unlearned k95/k99 (6/10) are degenerate and reported only to show the flag works;
  the meaningful unlearned number is total ≈ 0.

## What this does and does not do

- DOES: close the R68 IB question on this bank (effective alphabet 2); give future
  representation claims a number (any "uses cue X" claim must move the 0.0010-bit gap).
- DOES NOT: gate anything, license any claim, touch any bank, or imply RSI.
