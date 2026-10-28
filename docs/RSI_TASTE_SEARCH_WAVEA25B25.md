# RSI v25 search: rate-split refinement — FOUR-WAY TIE, region replicates

## v27 bank (`524cd68e…`): the plateau

Baseline Gen1 R=4 ρ=1: 6.042 dual-true. ALL FOUR cells bit-identical:

| cell | ρ | proc | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|---|
| a27-r125 | 1.25 | A | 6.308 | 4.988 | +1.32 | True | True |
| a27-r175 | 1.75 | A | 6.308 | 4.988 | +1.32 | True | True |
| b27-r16 | 1.6 | B | 6.308 | 4.988 | +1.32 | True | True |
| b27-r14 | 1.4 | B | 6.308 | 4.988 | +1.32 | True | True |

All dual-true, all beat baseline by +0.27.

## Mechanism: threshold saturation (weight-visible, behavior-invisible)

Founder taste weights DIFFER across ρ ([0.749,−6.745] vs [0.661,−7.346]
on the same history) but endpoints are bit-identical: greedy feeding
quantizes predictions at 0.5, so weight shifts that flip no decision
change no action, no energy. ρ∈[1.25,1.75] is behaviorally ONE point.
ρ=1→1.25 flipped one history (14→15 survivors); 1.25→1.75 flips
nothing. Determinism verified (rerun reproduces bit-exactly); isolation
probe reproduces via both advance() and step-loop. NOT a plumbing bug
(unit test: ρ doubles replay steps; V24 proved engagement).

## Adjudication: A-won/B-won UNDEFINED (not failed)

The frozen menu assumed ρ differentiates; the plateau makes procedure
comparison vacuous — a four-way tie by mechanism, the V22-degeneracy
precedent in reverse. No-eval rule: SATISFIED (four identical
dual-true claimants beat baseline). A-won predicate: UNDEFINED.
Tie-break by predeclared order → Gen17 fresh-evaluates the first-listed
A-greedy cell (ρ=1.25) as the line's second generation. Successive is
testable (Gen17 ACCEPT = line 2/2); productivity is NOT credited —
carried forward: the claim still needs TWO A-won generations after the
B-won V24 (V26 wide-menu A-won + V27 A-won), stated here before Gen17
runs. No bar moved: the claim's conditions only grow.

Lesson for menu design: refinement menus must step OUTSIDE the winner's
behavioral plateau — V26 goes wide (ρ∈{0.75,2.5} vs {0.5,3.0}-pool) so
procedures CAN differ.

80 worlds. Cumulative 4072.
