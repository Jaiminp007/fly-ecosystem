# Turn-gate QD transfer map — BH is the binding constraint; actor-side hypothesis specified

Date: 2026-10-26. Read-only (zero new worlds; frozen uniform/gain seg1
rows, attempts 02–09, 33 episodes). Two analyses: the licensed geometry
follow-up (§1, inconclusive) and a QD illumination of frozen rows (§2,
new artifact + reframing). §3 specifies the next probe (not executed).

## 1. Codebook geometry: inconclusive (honest negative)

HB cues pooled (n=60) vs Hamming-distance proxies (12-of-16 entry
codebooks are dense: 51/60 cues sit at dConflict=1 — low predictor
variance structurally limits this test):

- dConflict (min distance to test-harmful entry): r = −0.204
  (WRONG-signed vs discriminability prediction; d=1: 0.325, d=2: 0.255).
- dCarry (min distance to train-harmful entries): r = +0.178
  (right-signed, far too weak to license anything, p≈0.17).
- dSupport: r = −0.056 (zero).

Verdict: discriminability-via-Hamming is NOT supported as the residue
explanation. The test is weak (coarse predictor), so this is
inconclusive rather than falsifying — but nothing here licenses a
perceptual line. Geometry moves to the back of the queue.

## 2. QD transfer map — CORRECTED (retrospective archive; BH axis was inverted)

> CORRECTION 2026-10-26: BH correctness was 1−turn (inverted; same bug
> as VALUE-PROBE V1). True BH = turn rate. Map recomputed; the
> "BH binding constraint" and the "frontier tradeoff" below were
> artifacts and are WITHDRAWN. What stands: 7 elites with provenance
> (recomputed), gain pushes HB right, 18 empty cells.

Descriptor: (HB-correctness, BH-correctness) per pair-episode, 5×5 grid;
elite per cell = max (HB+BH)/2 with provenance. 33 episodes
(24 uniform + 9 gain seg1).

```
BH 0.8-1.0 | 48  62  67  76   .
   0.6-0.8 | 46  58  62   .   .
   0.4-0.6 |  .   .   .   .   .
   0.2-0.4 |  .   .   .   .   .
   0.0-0.2 |  .   .   .   .   .
             ------------- HB→
             .0  .2  .4  .6  .8
```

Elites: (0,3)=08uni .46 (HB=0.20 BH=0.72) | (0,4)=05uni .48 |
(1,3)=05uni .58 | (1,4)=07gain .62 | (2,3)=03uni .62 |
(2,4)=07gain .67 | (3,4)=09gain .76 (HB=0.65 BH=0.87).

Readings (descriptive, frozen data, CORRECTED):

- **7/25 cells, ALL in the top two rows.** BH acquisition sits at
  0.72–0.88 in every occupied cell — acquisition works everywhere.
  There is no BH floor and never was; the floor is HB-ONLY
  (extinction, 0.16–0.65 across the HB axis). The program spent three
  turns examining the wrong axis (an inversion artifact, not a
  phenomenon).
- **NO tradeoff.** The best cell (3,4: HB=0.65, BH=0.87, 09gain) is
  best at BOTH. Pair-level r(HB,BH) = +0.16 (30 pairs): easy/hard
  pairs don't trade off. The frontier runs along the HB axis only.
- **Gain pushes HB right** (right column = gain arms; uniform holds
  left). Same deployed story, no competition narrative.
- **Archive value (stands):** 7 recomputed elites with provenance;
  18 empty cells (all BH<0.6 — unreachable-in-practice, plus HB>0.8 —
  unreached); cell-occupancy remains the diversity metric V1d lacked.

## 3. WITHDRAWN: BH actor-side hypothesis (no phenomenon to localize)

> CORRECTION 2026-10-26: BH turns at 0.72–0.88 everywhere (this doc's
> corrected map + 30-pair table). There is no BH failure — cruising
> into harm at 80% never happened. The actor-side hypothesis below
> loses its phenomenon and is WITHDRAWN as a live hypothesis (not
> refuted — untestable where it matters, since VALUE-PROBE's
> INDETERMINATE came from an easy bank). The per-cue-values
> instrument stands as the method that settled it; a future use would
> target HB (where behavior 0.49 runs AHEAD of values 0.22 — the live
> value/behavior puzzle, inverted from the original actor-side story).

Original (superseded) text retained: BH pattern (cruise into newly-harmful cues at ~80%, re-encounter
without learning to turn, per the −0.75 endogeneity gradient) localizes
the failure to TURNING, not to valuing: the critic may well learn harm
(values drop) while the actor keeps cruising (policy inertia against
the greedy .5-threshold/.75-prior cruise default).

Discriminator (requires new instrumentation — future frozen plan):
log per-cue predicted values at seg end alongside behavior. Values
correct + behavior wrong → actor-side (fix: policy/threshold
plasticity). Values wrong → learner-side (fix: stronger negative
updates). Frozen rows contain neither per-cue values nor per-tick
streams (history = {seed} only), so this is NOT answerable read-only —
it is specified here to prevent a fourth blind analytic, not executed.

No new experimental line is licensed by this turn. Cumulative unchanged
(zero new worlds). No RSI claim.
