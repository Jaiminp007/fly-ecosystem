# MATE-LEAVE RESULTS V2 — magnitude ladder fails (NOGO, line CLOSED)

Date: 2026-11-02. Plan: `docs/MATE_LEAVE_PLAN_V2.md` (FROZEN, design only).
Implement: `8d04117` (5-arm instrument + sign-ladder fixtures + fresh-02
bank 440001–440054).
Attempt-02 (single, authorized): 30 mains / 0 probes / 53760 worldTicks /
1290240 founderSlots / 5.86e9 ops. Ledger exact, `redone: []`, G1+G2 true.

## Verdict: MATE-LEAVE-NOGO-V2

No monotone scaling: hubLeave2 gen-2 = 4 vs L1 6 vs L4 7 vs hub 4.
Replication half-passes (L2 ≥ 2 holds: 4), monotonicity fails (4 ≤ 6 ≤ 4
broken at L1 > L2). Per the frozen rule this is luck/saturation, not
mechanism — the magnitude thesis is dead. Line CLOSED (no ML3 without new
rationale).

## Per-arm totals (6 histories each)

- hubLeave1 (k_L=1): births 38, gen-1 32, gen-2 6 [1,0,1,1,2,1]
- hubLeave2 (k_L=2, ML1 replication): births 36, gen-1 32, gen-2 4 [0,0,0,0,2,2]
- hubLeave4 (k_L=4): births 39, gen-1 32, gen-2 7 [2,1,0,1,1,2]
- hub (k_L=0): births 31, gen-1 29, gen-2 4 [0,0,0,3,0,1]
- spread (descriptive): births 27, gen-1 26, gen-2 3 [0,0,0,1,0,1]

## Mechanism read (descriptive, non-gating)

- ML1's one-seed concentration (4/7 on 439001) did NOT replicate: L2's 4
  here spread 2+2 across two seeds, and no arm shows a 4-on-1 pattern.
  The concentration was bank-luck, correctly disclosed and now retired —
  but so was the effect size (7 → 4 at matched k_L=2).
- The ladder is non-monotone in the WRONG place: L1 (6) and L4 (7) both
  beat hub (4) while L2 (4) ties it (4 ≤ 6 ≤ 4 fails at L1 > L2). A U-shape
  (weak and strong cancellation help, parity does not) is conceivable but
  unlicensed — with 6 seeds/arm, ±2 gen-2 swings are noise-scale (cf. V1b
  3v2, ML1 7v4). The frozen verdict treats it as noise; no post-hoc shape
  is claimed.
- firstMatingTick IDENTICAL per-seed hubLeave2 vs hub (220/220, 246/246,
  237/237, 252/252, 243/243, 254/254) — seventh bank with unshifted timing.
  The gate never acts on encounter scheduling, at any magnitude.
- Births/gen-1 slightly ABOVE hub on all leave arms (36–39 vs 31; 32 vs
  29) — ML1's identical-births pattern did not replicate either. The only
  stable cross-bank facts remain the despotic deficit (hub poorer
  everywhere) and unshifted timing (7/7 banks).

## Arc position

LEAVE line CLOSED 1–1 (GO-V1 on survival conversion, NOGO-V2 on scaling):
spacing helped once, does not scale, concentration explained as luck.
The despotic crowding fact (5+2 banks) stands; the policy lever does not.
Licensed frontiers unchanged: sex-conditioned leaving, detection-sharing,
differentiation-first (R94), fear ecology (R100) — all need fresh rationale
+ frozen plans + fresh banks. No RSI claim.
Cumulative program spend: 7941 (+30 ledgered).
