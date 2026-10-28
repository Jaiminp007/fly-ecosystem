# Conditional-policy and intake-provenance diagnosis

## Result and limits

The failed tick actor-critic bank remains failed and closed. This post-hoc
diagnosis measures its recorded models and exactly replays its candidate worlds;
it opens no fresh performance histories or confirmation reserve. It establishes
small conditional policy changes on a fixed context set and a concrete sensory
threshold mismatch in actual intake records. It does **not** establish a causal
effect of either finding on qualification, that a replacement learner works,
or useful learning, retained skill, memory pressure, transfer or RSI.

The [next prospective design](CONTACT_CUE_VALUE_DESIGN.md) separates a lawful
contact-observation change from a direct action-value learning hypothesis.
Only the isolated observation component is implemented so far. There is no
new learner campaign or revised scientific gate. The full goal stays active.

## Fixed-context model measurements

Extraction from all eight immutable factual tapes verifies compressed/raw trace
hashes, source/result hashes and both original audit bindings. For every original
founder, it keeps the first and last recorded decision context in each phase,
merging identical ticks and listing absent contexts explicitly. It retains
initial, saved A/B, end-C and final weights for every original founder, including
subsequently dead bodies. Historical context evaluation is not body revival or
an all-founder performance estimate.

There are 1,336 contexts: 384 A, 384 B, 382 C and 186 return-A. At the same raw
physical inputs, evaluate the four odors belonging to that context's family and
the neutral odor for all five weight versions: **33,400 predictions**. Hidden
valence is used only in an observer's descriptive positive-minus-negative odor
contrast; it never enters a learner. No contexts, models or thresholds are fitted
or selected for favorable results. Python independently rebuilds every feature,
network output, ablation and parameter partition. Captured-source JS evaluation
matches exactly, and captured-source re-extraction reproduces input bytes exactly.

| Quantity | Observed result on the fixed context set |
| --- | --- |
| Largest total variation from initialization, any saved version/context/odor | 0.000809678 |
| End-A mean total variation on A contexts, including neutral | 0.000106580 |
| End-C mean total variation on C contexts, including neutral | 0.000204097 |
| End-A mean positive-minus-negative acceptance probability on A contexts | 4.64552e-7 |
| End-C mean positive-minus-negative acceptance probability on C contexts | 1.33691e-6 |
| Largest absolute acceptance association, any saved version/context | 1.35493e-5 |

These are raw probability units. They do not prove an unchanged conditional
policy everywhere or identify an optimal policy. The small probabilities help
explain why parameter activity alone cannot be called useful behavior; the
original acquisition/performance gates already failed independently.

Across all 192 original models, end-A absolute parameter changes from
initialization sum to 0.360034 in shared hidden parameters, 0.260089 in policy
heads and 8.084088 in the value head. End-C sums are 0.665340 / 0.483534 /
7.362327. These partition sizes and weight scales differ; this is not a normalized
importance score or proof of critic-caused training failure. Shared hidden
parameters receive both actor and critic updates.

Resetting only the value head leaves inference policy identical, as the model's
algebra requires. Restoring initial policy heads makes policy equal to its
initial constant probabilities even with learned hidden weights. Restoring only
hidden weights changes policy by at most 2.33089e-7 in total variation over the
tested substitutions. These are **inference interventions on stored models**,
not rerunning training with a loss removed, an embodied causal effect or RSI.

## Exact consumed-patch provenance

Observer instrumentation wraps the existing energy-charge/intake callbacks.
At sensor time it records position and patch amounts; immediately before and
after that body's intake it observes patch amount differences. It adds no policy
inputs, gradient, body action or physical charge. All eight candidate runs match
the original factual event hashes and complete final checkpoint hashes exactly.
A second self-contained replay from captured frozen source files, initial
checkpoints and expected hashes reproduces every provenance record exactly.

Python independently checks patch geometry from the initial fixed grid,
cue/valence and amount consistency, stationary position identity and aggregation
against every original cue/intake contingency cell. It does not independently
simulate the physical world; exact Node replay provides simulator provenance.
The recorder's CPU/wall costs are retained separately from the original study.

| Count across candidate histories | Value |
| --- | ---: |
| Positive-amount intake receipts | 131,454 |
| Single-patch intake receipts | 131,454 |
| Decision cue sign disagrees with consumed patch sign | 60,267 |
| Consumed patch differs from the decision cue identity | 91,145 |
| Intake with a neutral decision cue | 524 |
| Consumed patch amount was <=.06 at sensing | 119,611 |
| Consumed patch already within radius 15 and <=.06 at sensing | 118,193 |
| Sign mismatch with that already-local low-amount condition | 58,862 |
| Intake from a patch outside contact before movement | 6,112 |

Stationary actions account for 35,077 intake receipts and 16,515 sign mismatches.
All 16,515 stationary mismatches concern already-local patches below the sensing
amount threshold; none involved movement across contact. This is stronger than
the earlier synthetic existence fixture: it establishes the condition's
prevalence within this particular failed candidate bank. It does not generalize
to other policies, environments or seed distributions without fresh evidence.

The frozen sensor filters food to amount >.06 before choosing its contact cue,
whereas intake can consume smaller positive amounts. In these ordinary grid
worlds, 32-unit patch spacing and radius 15 prevent two distinct patch centers
being local at once. Thus a depleted, still renewing local patch can be eaten
while the sensor reports another patch's odor. This directly identifies the
sensory/consumption boundary behind those recorded cue mismatches. It does not
prove that a consistent contact observation suffices for learning or resolves
movement-related credit or long-horizon action value.

## Software evidence, preservation and continuation

The full suite passes **234/234**, with no skipped or failed tests. Five new
policy/provenance tests cover observer isolation, head/hidden ablations,
independent arithmetic, copied-source replay, threshold reproduction, UTF-8
streaming and nine altered-record classes. Three contact-component tests cover
radius/ties/fallback, actual metering and forbidden amount/valence/ID access.
`git diff --check` passes.

The first provenance reader incorrectly decoded each gzip output chunk as an
independent UTF-8 string. A split middle-dot in a death-event checkpoint caused
its strict hash guard to fail **before** replay. The diagnostic now uses a
streaming decoder; a test deliberately splits that character at a 16-KiB
boundary. The original failed log is preserved. No frozen scientific source,
trace, result, gate or archive was changed.

Authoritative new diagnosis directory:
`evidence/tick-policy-diagnosis/20261025-v1/`. It contains inputs, exact
re-extraction, conditional results, numeric checks, every consumed-patch record,
standalone physical provenance replay, full/current and frozen source captures,
logs and a hash-bound derived summary. Portable archive:
`handoff/tick-policy-diagnosis-20261025/manifest.json`. The original failed bank
and its archive remain separate and unchanged. Work remains local/uncommitted.

Next: engineer the fixed direct-value learner and matched observation/mechanism
controls, with explicit sensory/history/replay costs and complete checkpoints.
Independently audit them, then lock one complete fresh protocol. Do not use this
bank to choose rates, repeatedly test candidates, drop pressure or transfer
requirements, extend the sample or open its sixteen-history reserve.
