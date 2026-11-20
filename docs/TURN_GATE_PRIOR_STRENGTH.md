# Turn-gate prior-strength — CORRECTED: overshadowing null stands; pre-exposure unifies as LI (both directions)

> CORRECTION 2026-10-26: BH correctness was 1−turn (inverted; same bug).
> True BH partial = **−0.535** (was +0.535); quintiles 0.82→0.78
> (were 0.18→0.22). The LI/PH "dissociation" below was half-artifact:
> BOTH directions are LI-like (pre-exposure retards re-learning), BH
> more strongly. The PH half is retracted; the negativity-bias
> framing (λ=2.95, values) stands — behaviorally it's LI all the way
> down. Actor-side BH line WITHDRAWN (no BH phenomenon: BH turns
> 0.72–0.88 everywhere).

Date: 2026-10-26. Read-only (zero new worlds; frozen uniform-seg1 rows,
attempts 02–09 + frozen train weights). Two batteries: the round-21
Kamin top-move (per-channel overshadowing on frozen weight vectors —
NULL) and a train-pre-exposure battery (LI-like both directions).

## 1. Overshadowing battery: null (honest)

Phi encoding recovered: taste phi = [1, 4 linear bits, 6 pairwise, 4
triple, 1 quad] = 16 dims (orthogonal config); rows carry full
taste/actor vectors per agent, so per-bit carried votes are exact.
HB cues (n=60), carried train weights:

- r(correctness, carried total) = +0.133; harm-vote +0.177;
  benign-vote +0.167 — right-signed, weak. Prior strength matters
  slightly; not the story.
- r(correctness, vote CONCENTRATION) = **+0.076** — the Kamin
  prediction (blocked/redundant channels carry the error) FAILS.
- r(correctness, harmful-NEIGHBOR anchor) = **+0.053** — the elemental-
  interference version FAILS too.

Elemental concentration does not explain the floor. The weights source
is validated (meaningful votes, right signs) and stays open for other
questions — but overshadowing is out.

## 2. Pre-exposure battery: LI in BOTH directions (CORRECTED — was reported as LI/PH split)

Per-cue TRAIN contacts vs seg1 correctness, controlling test contacts
(prevalence path) — BH computed with TRUE correctness (turn rate):

| direction | raw r | partial (∣testC) | LOO range | quintiles |
|---|---|---|---|---|
| HB (fear→benign) | −0.221 | **−0.173** | −0.12…−0.26 | flat then q5 dip 0.25 |
| BH (liking→harm) | −0.240 | **−0.535** | −0.48…−0.58 | monotonic 0.82→0.78 |

HB: more aversive pre-exposure → harder extinction (LI-like, modest).
BH: more appetitive pre-exposure → SLOWER harm acquisition (LI-like,
STRONG, raw=log robust, LOO all-negative). Same manipulation, same
direction — latent inhibition, direction-general, stronger for
appetitive priors (approach habits run deeper than avoidance ones —
or: unlearning a liked cue costs more than unlearning a feared one):

- BH: strong prior liking + harm violation → SLOWER turn acquisition
  (−0.54). Prior strength is a brake, not an engine. (The V1 "PH"
  reading — big violation → fast learning — was the inversion
  artifact; the values DO swing hard (λ=2.95) but behavior doesn't
  follow on strong-prior cues — the one place an actor-side gap
  still shows, descriptive only.)
- HB: strong prior fear + benign violation → slower extinction
  (−0.17). Appetitive learning is intrinsically slower AND retarded
  by harm priors (LI + negativity bias compound).

## 3. Unification (CORRECTED): one floor, LI brakes, no tradeoff

- There is ONE floor: HB extinction (0.16–0.47 pair range). BH
  acquisition works at 0.72–0.88 everywhere — no second floor, no
  coexistence to explain, no tradeoff (pair r(HB,BH)=+0.16).
- Its brakes are LI-like in both directions (HB −0.17, BH −0.54):
  pre-exposure retards re-learning; appetitive priors retard most.
  Values swing hard on harm (λ=2.95) but strong-prior cues' behavior
  lags — the residual actor-side-flavored gap, descriptive only,
  insufficient for a line (no phenomenon: BH turns fine on average).
- Gain's role reframed: lifts all contact levels without flattening
  (HB +0.13, BH +0.08) — shouts over the LI brake without lifting
  it. Next is brake-lifting (Bavelier/disinhibition, Mackintosh
  associability-reset), not more gain or more ticks.

## 4. Program moves (specified, not executed) — CORRECTED

Single-knob hope is dead (unchanged): the floor needs VALUE-side help
(associability-reset / antiprior / appetitive-boost — Mackintosh arm).
BH ACTOR-side line WITHDRAWN (no BH phenomenon; VP INDETERMINATE
stands as the method's verdict on an easy bank; threshold-plasticity
freeze stays withdrawn). The HB value-lead puzzle (behavior 0.49 runs
AHEAD of values 0.22 — actor leads, critic lags) is the open
value/behavior question. No line licensed by analysis alone.
Cumulative unchanged. No RSI claim.
