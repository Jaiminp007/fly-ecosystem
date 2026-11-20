# TRANSFER LEG AUDIT V1 (link-to-link T1 vs T2, read-only)

Date: 2026-11-02. Zero worlds. Reads frozen C4–C13 attempt rows
(C2/C3 rows lack `transfer.sourceDigest` — older schema, excluded,
disclosed). Pairs each T1/T2 row with its transplant source via
`transfer.sourceDigest` (data-driven, no chain constants), scores
flip-split HB via the frozen `scoreFlipSplitV1m`. n=2 per cell —
DESCRIPTIVE ONLY, no verdict changes, hypothesis-generating.

## Framing (matters)

The C-scorers anchor T2 to TRAIN (`hb('double-T2','double-train')`
= endpoint transfer). This audit anchors each leg to its transplant
source (train→T1 = link 1; T1→T2 = link 2). Different questions:
endpoint asks "how much survives two links", leg asks "which link
converts". Both valid; the record now states which is which.

## Link-to-link HB means (T1 = link1, T2 = link2)

- C4: all flat (~0.27–0.31 both links).
- C5: ALL arms link2>link1 (~0.34→~0.48) — bank-wide recovery.
- C6: mixed small (looper/static up, copied down).
- C7: ALL arms link2<link1 (~0.46→~0.34) — bank-wide decay.
- C8: mixed (copier/static up, looper down).
- C9: flat-low (~0.25 both).
- C10: ALL arms link2<link1 (0.36–0.40→0.18–0.28) — decay, and
  C10 is the no-adoption line: pure-transplant legs decay on
  that bank without any operator confound.
- C11: flat (~0.31 both).
- C12: looper/static decay, copier recovers (mixed).
- C13: double 0.286→0.444 (+0.158 recovery); single 0.293→0.302
  (flat); static 0.269→0.315 (+0.045). The double arm's second
  link recovers MORE than static's on the same bank.

## Reading

1. **No universal leg effect.** Link2>link1 on some banks (C5,
   C13-double), link2<link1 on others (C7, C10), flat elsewhere.
   Leg direction is bank×arm-specific, not structural. C13's T-leg
   asymmetry is NOT a general "first transfer is harder" rule.
2. **C13-double's link-2 recovery (+0.158 vs static +0.045)** is
   consistent with (not proof of) second-fire value on that bank:
   the arm that re-fired at 1024 converts its T1→T2 link better
   than the arms that didn't. Same direction as G2b (+0.030),
   larger in link space. Still descriptive (n=2, one bank).
3. **C10's pure-transplant decay** (no adoptions anywhere) bounds
   the leg question cleanly: legs can decay with zero operator
   involvement — the substrate, not the loop, sets the leg sign.
4. Nothing here reopens any closed verdict (all NOGO/INVALID
   stand; this audit only describes their insides).

## Addendum 2026-11-02 (C14 links; appended, not rewritten)

C14 link-to-link HB (n=2 per cell, descriptive): copied 0.254→0.408
(+0.154); sparse 0.312→0.342 (+0.030); static 0.353→0.312 (−0.041).

Pattern: both config-carrying arms (sparse evaluated, copied blind)
recover on link 2; the no-config arm (static) decays — on the same
bank, opposite leg directions by arm. Recovery does NOT track
evaluation (blind recovers MOST, +0.154 ≈ C13-double's +0.158).
This further deflates any "evaluation drives transfer" story
(consistent with G2b's chronic smallness): what little link-2
recovery exists rides the carried CONFIG, evaluated or not.
Reinforces finding 1 (no universal leg; arm×bank specificity) and
finding 3 (substrate sets the sign). No verdict moves.

## Licensed follow-ups (none executed)

- A "warm-up transfer" line is NOT licensed: no universal leg
  effect exists to exploit (finding 1 kills the rationale).
- The link-space framing (leg-anchored scorer) is available to any
  future frozen plan as a SECONDARY readout (endpoint stays
  primary — the claim is about transfer, not links).
