# BALDWIN plan V1 — slow-weight consolidation screen (FROZEN)

Status: FROZEN 2026-10-30. Single authorized Phase-A attempt under its own
plan. No code, no bank, no worlds yet. Further changes require V1a+.

## Why this line (and why it is new, not a repeat)

The Baldwin effect (1806.07917, 1702.08411): learning guides evolution;
learned behaviors become innate via genetic accommodation (slow tracking of
fast adaptation). Our engine HAS the full slow-weight machinery, verified
read-only: `slowTaste` created iff `consolidationRate>0`
(`taste-energy.mjs:53`); replay-mode mutual fast↔slow tracking
(`:155-157`); checkpoint create/validate/restore handling (`:363,:389`,
`:396`). But `consolidationRate=0` in EVERY run ever — never switched on.
This is NOT direction-protection (WHAT-RETAINS CLOSED that) and NOT update
gating (M-GATE/S-GATE CLOSED those): consolidation = slow TRACKING of fast
weights, untested anywhere in the program.

## Mechanism + scale argument (pre-registered, not tuned)

Replay-mode update per record (`:151-157`): with rate g,
`fast += g(slow−fast)`, `slow += g(fast−slow)`. Correction to the
first draft of this section (caught pre-commit): replay does 4 passes × 1
record per tick (strata=1), NOT ~160 — so per-tick pull ≈ 1−(1−g)^4 ≈ 4g
(≈0.04%/tick at g=0.0001 → τ≈2500 ticks; ≈0.4%/tick at g=0.001 → τ≈250).
Per 512-tick phase: ≈18% convergence (weak: slow trails far behind the
phase mean) and ≈87% (moderate: slow nearly tracks the phase). Menu
{0 (control = BT base byte-identical), 0.0001 (weak), 0.001 (moderate)}
brackets slow→fast tracking. Values chosen from this arithmetic BEFORE any
data — not tuned, not revisit-able under V1. Honest caveat, pre-registered:
the phase structure (512 learn / 1024 distract) is ADVERSARIAL to slow
tracking (a τ that learns A in 512 cannot hold it through 1024 of B+C);
the test is whether ANY of the bracket helps return-A regardless.

Predicted effect (the sharp hypothesis): in phase A (stable) fast converges
to the A-solution and slow follows; through B/C (shifted/scarce) fast
adapts away while slow lags near A; on return-A the replay pulls fast back
toward the slow-held A-solution → FASTER re-adaptation than the control,
whose slow weights don't exist. This is M-RELEARN's paradigm moved to the
episode consolidation should win: re-adaptation to a PREVIOUSLY-SEEN
context ([B/C episodes saturated at 0 ticks — V1a — so return-A is the
discriminating episode]).

## Grid and bank

- 3 arms (cons0/control, cons-weak 0.0001, cons-moderate 0.001) × 4
  histories = 12 mains, 0 probes. BT mains (1792 ticks), candidate
  learners; consolidationRate is the ONLY config difference (audited).
- Fresh dev bank `evidence/baldwin-dev/fresh-01/`: 4 histories × 9 slots =
  36 seeds, range **402001–402036**. VERIFIED clean 2026-10-30 (zero exact
  tokens repo-wide). Spend 12 mains; other 24 slots reserved-excluded.
- Caps: ≤300 exec (12 used), ≤20e9 ops, ≤3600s wall. Single attempt;
  crash-resume only with dual provenance; no second attempt under V1.

## GO bars (conjunctive, fail-closed; mechanism screen only)

- G1 integrity: 12/12 mains complete; ledger exact; `redone` empty.
- G2 config audit: every main's learnerOptions equal BT base except the
  frozen consolidationRate for its arm (digest-compared); slowTaste present
  iff rate>0. Else INVALID.
- G3 effect: median return-A ticks-to-80%-of-own-phase-A-max (per-tick
  curves, M-RELEARN V1a machinery, return-A episode ticks 1536–1791,
  same 50%-survivor + sustain rules) for EITHER consolidation arm is ≥64
  ticks (≈2 bins) below control median → GO. Else NO-GO.
- G4 saturation guard (checked FIRST): control median ≤64 ticks → metric
  saturated (relearning already instant) → INCOMPLETE-SATURATED
  ("mechanism untested, metric wrong" — licenses re-metric, not re-run).
  Not a mechanism failure, not a pass.
- G5 fixtures (gate): 5 — scorer branches (GO/NOGO/INVALID/INCOMPLETE-
  SATURATED on synthetic curves); bank + union-exclusion; config-switch
  unit (slowTaste iff rate>0); return-A episode windowing; full triage
  clean.
- Verdict: !G1→INVALID; !G2→INVALID; saturated→INCOMPLETE-SATURATED;
  G3→GO else NO-GO. No transfer claim, no RSI claim. GO licenses proposing
  a consolidation follow-up (transfer/retention with slow weights); NOGO
  closes consolidation as a retention mechanism.
