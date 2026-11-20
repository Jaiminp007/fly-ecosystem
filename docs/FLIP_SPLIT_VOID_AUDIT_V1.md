# FLIP-SPLIT VOID AUDIT V1 — metric support across the C-series (zero worlds)

Date: 2026-11-02. Analytic only (frozen C2–C11 rows, REAL scorer
`scoreFlipSplitV1m` re-applied read-only; zero new worlds, no
rescoring — the scorer is re-run as a measuring instrument on
frozen rows, verdicts untouched). Question (from C11's T1 half-void):
is the flip-split metric fragile (thin subsets) program-wide?

## Void counts per line (12 transfer rows each: T1/T2 × arms × 2 chains)

| Line | Transfers | voidHB | voidBH | voidSame | Median HB contacts |
|---|---|---|---|---|---|
| C2 | 12 | 0 | 0 | 0 | 5,504 |
| C3 | 12 | 0 | 0 | 0 | 3,932 |
| C4 | 12 | 0 | 0 | 0 | 3,646 |
| C5 | 12 | 0 | 0 | 0 | 3,566 |
| C6 | 12 | 0 | 0 | 0 | 3,322 |
| C7 | 12 | 0 | 0 | 0 | 5,081 |
| C8 | 12 | 0 | 0 | 0 | 3,402 |
| C9 | 12 | 0 | 0 | 0 | 4,471 |
| C10 | 12 | 0 | 0 | 0 | 2,899 |
| C11 | 12 | 3 | 0 | 0 | 1,697 |
| TOTAL | 120 | 3 | 0 | 0 | — |

## Findings

1. The metric is SOLID program-wide: 117/120 transfer rows have all
   three subsets non-void, on thousands of contacts (median HB
   contacts 2,899–5,504). C6's near-miss (0.0964), C8's splits,
   C5/C7 lifts — all rest on rich subsets. No fragility discount
   applies to any published lift.
2. C11's 3 voids are all chain0-T1 (seed 465010) across arms
   (looper/static/copier share the history → same cue set) — a
   single history with zero flipped-HB contacts, not a metric
   property. BH (0.74) and same-val (0.95) on the same rows are
   rich; only the HB direction is unobservable there.
3. Void rate overall: 2.5% (3/120), concentrated in one history of
   one bank. The G2a half-void in C11 is correctly read as a
   history gap (already published), and chain1's +0.042 stands on
   full subsets.

## Standing

- Zero worlds. No verdict changes (strengthens published readings
  by ruling out thin-subset artifacts). Cumulative unchanged (8351).
