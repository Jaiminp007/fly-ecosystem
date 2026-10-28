# Two different hypotheses, and an action-support mismatch

October 25, 2026. The user requested broader iteration and then asked to conserve
Astra usage. The remaining implementation, evaluation, independent checks and
preservation run locally; no further Astra review was requested after that limit.
This work changes no old bank, scientific gate, default environment or controller.

## Factual census: actual acquisition, actual strong reference

The [fixed census](PURSUIT_CENSUS_DESIGN.md) observes eight original attempt-15
candidate trajectories and their bare full-speed transfer references. Every
final acquisition endpoint, complete end-C anchor and complete returned bare-full
probe object matches its preserved original exactly. Observation does not change
learner work, charged costs, physics or random streams. Runtime: **40.41 seconds**.

Across A/B/C there are 290,686 body decisions and 73 rejected translations.
Native-full transfer has **77 rejected translations in 38,663 decisions** (0.20%),
no boundary clipping, and 4,099 decisions with a deep-interior advertised target.
Whole target episodes with no beneficial intake occupy 724 transfer decisions
(1.87%). These are descriptions, not missed-opportunity or recoverable-loss bounds.
Other food can be collected while the advertised target is inaccessible.

The independent check also includes zero-intake streaks within eventually
productive episodes, rather than treating such episodes as uniformly productive.
In transfer those streaks have median 3, 90th percentile 12 and maximum 50 ticks;
A/B/C maxima are 179/287/197. Even a long streak may be useful travel or deliberate
toxin refusal. Geometry, collision flags and target identity never enter a policy.
The evidence does not justify another obstacle-escape controller at this point.

All per-step records, every episode, per-phase/founder distributions and separate
acquisition summaries for the bodies that reach transfer are preserved. No
duration cutoff or successful subset was searched.

## Different information hypothesis: social yield prediction

The [prospective information test](SOCIAL_YIELD_DESIGN.md) trains independent
per-founder predictors from their own factual A/B/C records and freezes weights
before native-full transfer. The target is any beneficial intake in the next
eight transitions. Labels become available only after all eight own outcomes;
no window crosses a phase boundary. Censored final decisions are reported.

Five fixed models compare food/context/own-command information, that information
plus current social cues, equally shaped social-blind inputs, 32-decision delayed
own-social inputs, and own learned prevalence. This is not pooled learning,
another action controller or a causal test of competition. Runtime: **2.70 seconds**.

The specified current-social model fails its information rule:

- Against food-only and same-dimensional blind controls, Brier loss is worse by
  **0.0050095**, and log loss by **0.0125787**, averaged equally over histories.
  It loses on both measures in all eight histories.
- Against delayed-social control, its mean losses are also worse; it wins 4/8
  histories, below the declared 6/8 requirement.
- All context-bearing models beat learned prevalence in transfer. Thus this
  does not show that learned prediction cannot transfer, nor that social cues
  contain no information. It rejects this fixed proposed social increment.

No model, feature, rate or horizon sweep follows the outcome. No energy gain is
claimed for an offline predictor, and no controller is built from this failure.

## Structural finding: transfer action was never sampled

Every acquisition history executes movement commands **-1 and 0 only**
(stationary and half speed). Every native-full transfer record executes **1**.
The inherited motor learner therefore has no direct factual experience of the
strong reference's full-speed action during A/B/C. Geometry, valence and policy
also change at transfer. A model could extrapolate using additional assumptions,
but those assumptions are not acquired evidence for this unseen action's value.

This makes another small update-rule change an especially weak next step. A
coherent next interface must let an agent actually experience the actions whose
advantages it is supposed to retain and transfer. It must also expose a lawful
alternative to the built-in greedy target selector if target reliability is the
skill. Supply identical actuator/sensor access to reset, frozen and fixed controls;
keep original bare native-full as a benchmark. Any changed interface is a NEW
prospective research hypothesis, not a rescued result on the old qualification.
Demonstrate paid control headroom and acquisition coverage before learner tuning.
Do not create an artificial impairment solely to make calibration look useful.

## Checks and preservation

Four targeted checks pass in 0.182 seconds. The independent Python check streams
all eight tapes, checks every episode's totals and hashes, reconstructs all frozen
transfer labels, predictions, losses and arithmetic-work formulas, and recomputes
every comparison and decision rule. It passes in about 5.5 seconds. It does NOT
independently reconstruct the online SGD training updates or establish causality.
The earlier observer test retains exact complete checkpoint equality; its initial
regrouped-sum assertion was corrected only for ordinary summation roundoff.

Raw evidence: evidence/pursuit-census/20261025-v1/ and
evidence/social-yield/20261025-v1/. Portable self-contained supplement:
handoff/pursuit-social-20261025/manifest.json. This includes input protocols,
original anchors, original comparison rows and captured source dependencies.
All original qualification/retention/functional-pressure and RSI criteria remain
unachieved and unchanged. No branch, commit or PR push is made.
