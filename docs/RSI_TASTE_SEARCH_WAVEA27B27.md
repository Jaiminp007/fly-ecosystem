# RSI v27 search: cautious-live × aggressive-replay — NO CLAIMANT, combination-2 CLOSED

## v29 bank (`f31eab79…`): joint optimum fails

Baseline Gen1 R=4 (tr=1.0, ρ=1.0): 7.573 dual-true.

| cell | (tr,ρ) | proc | score | vs bar | A | B |
|---|---|---|---|---|---|---|
| a29-t03r15 | (0.3,1.5) | A | 5.439 | −2.13 | True | True |
| a29-t03r20 | (0.3,2.0) | A | 5.928 | −1.65 | False | True |
| b29-t05r20 | (0.5,2.0) | B | 5.690 | −1.88 | True | True |
| b29-t05r15 | (0.5,1.5) | B | 5.690 | −1.88 | True | True |

B menu draw mulberry32(20261121) → ['(0.5,2.0)','(0.5,1.5)'].

## Findings

* SECOND compositional negative: tr=0.3 won alone (Gen13 ACCEPT), ρ=1.5
  won alone (Gen16 ACCEPT), combined they lose −2.1 level. Stacking
  accepted dials is not monotone (V20 μ×tr the first case). The joint
  optimum V24 hypothesized does not exist: slow live + fast replay
  surrenders level everywhere tested.
* (0.3,2.0) repeats the Gen15 signature (aggressive rehearsal kills the
  oldest leg when live is too slow to re-acquire: A-False).
* BEHAVIORAL PLATEAU again: (0.5,1.5)≡(0.5,2.0) bit-identical (5.690).
  Threshold saturation is the rule, not the exception, in this space —
  greedy quantization absorbs weight shifts across wide dial ranges.

## Verdict: NO CLAIMANT → combination-2 CLOSED

No cell dual-true beats baseline → 0 eval spent. Per predeclared V27
stakes the line closes; program moves to V28 (adaptive per-record
replay rates — surprise × rate-split interaction, last untested
combination of accepted mechanisms). 80 worlds. Cumulative 4304.
