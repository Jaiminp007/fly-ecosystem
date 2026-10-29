# M-RELEARN plan V1 (readaptation speed, not preservation)

Frozen 2026-10-29. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-A attempt + conditional single Phase-B attempt.
Parent findings (do not re-litigate): preservation failed 4×; direction
closed permanently; volume irrelevant; reset≈candidate everywhere; the
development gain is exploration-tax avoidance (M-ORIGIN); margins predict
outcomes (G1 ×2, substrate, not objective).

## Objective function (new)

Minimize TICKS-TO-CRITERION (readaptation speed), not retention-vs-control.
Rationale (frozen): starting over is proven cheap, preservation proven
impossible, and faster readaptation compounds across bodies/lifetimes —
preservation was a means, never the end. A measured ceiling (relearning
already fast) is an equally publishable success.

## What the harness already gives (verified read-only 2026-10-29, zero worlds)

- Continual main (1792 ticks): A stable 512 / B moving-shiftEvery128 512 /
  C scarce-nutrient.2 512 / return-A stable 256. Context changes mid-main.
- `reset` arm: wiped entering B and C → TWO from-scratch relearning episodes
  per main (B-moving, C-scarce), no new machinery. `frozen`: retention
  without learning. `candidate`: ceiling. `unlearned`: floor.
- Curves need NO instrument: `run.phaseRows` (in-memory post-advance) +
  per-tick emit (`{type:'observe',own:{tick,energy}}`, recording-emit is
  behavior-identical per D1 tests) binned 32 ticks in the dev script.

## Phase A — baselines (fresh bank 384001–384054: 6 histories × 9 seeds)

24 mains (4 arms × 6 hist: candidate/unlearned/frozen/reset; accepts dropped
as curve-irrelevant), ZERO probes. Per main: save phaseRows + emit-binned
energy curve (per-founder means; bin-n recorded).
Criterion (PRIMARY, frozen): reset-episode ticks-to-80%-of-own-phase-A-max
(max over bins with ≥50% founders alive; sustained 2 consecutive bins;
first-sustained-bin-start minus episode start; censored at 512 if never).
DEATH GUARD (M-ORIGIN lesson, fail-closed): criterion AND reference bins
require ≥50% survivors or the episode is censored (recovery must not be
culling in disguise).
Reported (not gating): frozen B/C decay curves; candidate ceiling; unlearned
floor; return-A rebound (snap-back = retained memory vs relearning test).
Caps (Phase A alone): ≤300 exec / ≤20e9 ops / ≤3600s wall / ≤200MB (shared
envelope; Phase A expects ≈24 exec / ≈1.5e9).
G5 (Phase A): full suite green (6 shifted-pristine only) + dev-script smoke
(pure functions + bank build) BEFORE any world.

## Phase-B gate (pre-registered; V1a amendment freezes family + bars)

If median ticks-to-80% > 256 (one probe-length) in EITHER episode (B or C):
gap worth closing → V1a chooses ONE intervention family and freezes its
conjunctive bars. Else: line closes with a ceiling proof (publish equality).

## Intervention candidates (frozen with falsifiers; V1a picks ONE)

1. Exploration scheduling (high early-episode exploration → greedy late).
   Falsifier: not faster than greedy-always.
2. Plasticity modulation (surprise-keyed tasteRate/renewalRate boost, first K
   episode ticks). Falsifier: identical curve.
3. Primer-transfer (transplant atA weights at wipe instead of zeros; tiny new
   machinery, V1a-scoped). Falsifier: primer ≡ zero-start.
4. THE INVERTER — anti-rehearsal (replaySkip during relearning episodes;
   stale records are the brake; contradicts the pro-rehearsal prior).
   Falsifier: skipping changes nothing or harms.

## Not included

No qual/reserve contact; no bank reuse/regeneration; no rescoring; no RSI
claims; no second attempts per phase (crash-resume only under V1d terms:
bank SHA, dual provenance, redone disclosure, ledger-exact, no second
resume). On GO: Phase-Q proposal separate. On NOGO/ceiling: close, publish.
