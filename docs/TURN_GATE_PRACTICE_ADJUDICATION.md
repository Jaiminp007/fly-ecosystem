# Turn-gate practice adjudication — CORRECTED: both gradients positive; BH is anti-endogenous practice evidence

Date: 2026-10-26 (corrected same day, zero new worlds). Read-only;
frozen rows attempts 02–09 + frozen banks untouched.

> CORRECTION: the V1 version coded BH correctness as 1−turn (inverted;
> same bug as VALUE-PROBE V1). True BH correctness = turn rate
> (avoidance). Corrected: BH r = **+0.752** (was −0.752), mean **0.798**
> (was 0.202). The endogeneity proof below collapses and inverts: the
> BH gradient now runs AGAINST endogeneity, making it the cleaner
> practice evidence. HB numbers were correct throughout.

Question: is the transfer floor (harm→benign stall ≈0.3–0.4 at 1×)
practice-limited or rigid? (Note: the floor is HB-ONLY. BH acquisition
succeeds at 0.72–0.84 on all 30 pairs — there is no BH floor. The
"BH binding constraint" in TURN_GATE_QD_MAP.md was the same inversion
artifact, corrected there.)

## 1. HB contact gradient: +0.5, robust (unchanged, correct)

Pooled HB cues, uniform-seg1, 8 lines × 3 pairs (n=60): r = +0.505,
Spearman +0.492, monotonic quintiles 0.25→0.42, LOO 0.45–0.57.

## 2. BH gradient: +0.75 — anti-endogenous (CORRECTED)

Same pooling for BH (n=58): r = **+0.752**, mean 0.798. Same-valence
control (benign→benign, correctness = 1−turn): flat r=+0.03, mean 0.949.

Behavior→exposure endogeneity predicts OPPOSITE signs (HB correct =
cruise = stay → more contacts; BH correct = turn = leave → fewer
contacts). Observed: SAME sign, both strongly positive. Endogeneity
would produce a NEGATIVE BH gradient; the observed +0.75 runs against
it — so the BH gradient cannot be endogeneity-dominated and stands as
the cleaner practice evidence of the two (HB's gradient remains
endogeneity-compatible: cruise→stay confound unexcluded).

## 3. Gain tests: lifts without flattening, both directions

If contacts were THE binding constraint, learning-per-contact gain
should substitute for contacts and flatten gradients:

- HB: uniform r=0.668 mean 0.283 → gain r=0.677 mean 0.409 (+0.126,
  zero flattening).
- BH: uniform r=0.853 mean 0.779 → gain r=0.756 mean 0.860 (+0.081,
  minimal flattening).

Both manipulable components are largely contact-orthogonal: gain lifts
all contact levels ~equally. Practice matters (gradients) but the
gain-responsive channel isn't exposure — consistent with an
associability brake (LI: −0.17 HB / −0.54 BH partials): exposure helps,
priors resist, gain shouts over both without removing either.

## Verdicts (corrected; negative-preservation)

1. **Noisy replay NOT licensed (strengthened).** Practice now has
   genuine support (BH +0.75 anti-endogenous) — corrupting the few
   updates rare cues get is even less indicated than under V1's
   reasoning.
2. **Naive exposure-extension NOT licensed (reason changed).** Not
   confounded anymore — but saturated (V1d/V1e: +0.26 then +0.01) with
   an LI brake on top (more exposure fights stronger priors). The
   returns are spent; the next move is brake-lifting (Bavelier), not
   more ticks.
3. **No new experimental line.** The residual HB floor (0.16–0.47 pair
   range) is unexplained — remap ruled out (r=+0.23 wrong-signed),
   timing untestable frozen. Specified next: first-contact logging on
   any future line (already piggybacked on GAIN-DOSE V1).

## Specified next analytic (unchanged, done since)

Codebook geometry was executed (TURN_GATE_QD_MAP §1): inconclusive
(r≤0.2). The analytic queue behind this doc is complete; the open
items are instrumented measurements (first-contact ticks), not further
read-only forensics.
