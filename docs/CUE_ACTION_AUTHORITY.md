# Prospective cue/action authority diagnostic

This is a new environmental hypothesis after four failed embodied learning studies. It cannot change their outcomes. No candidate learner is evaluated by this diagnostic. Its purpose is to establish whether the proposed sensory/action interface offers physically useful headroom before spending another qualification bank.

## Fixed environment and interface

The opt-in `compact-cue-foraging-v8` engine uses the original bodies, food inventory, movement/metabolism and continuing A512/B512/C512/return-A256 schedule. Reproduction and mutation are disabled. At phase entry, food patches receive one of four arbitrary four-bit odors and a hidden beneficial/harmful assignment. Twelve distinct patterns are randomly allocated across the three families, with two beneficial and two harmful patterns per family. Assignment/resource/shuffle/null RNG streams are external and independent of physical RNG. Transitions and moving renewal centers preserve energy, food amounts, body states and acquired state; no refill occurs. Return-A restores A associations on a new patch allocation.

The odor source is the nearest detectable contact patch within 15 units, otherwise the strongest detected patch. Direction/proximity sensors retain their original strongest-patch meaning, so odor and steering targets can differ; decisions precede movement and last eight ticks. Neither a privileged oracle nor a cue lookup has future knowledge or perfect control of subsequent contacts. All detected food remains geometrically attractive regardless of hidden valence.

`cueObservation` replaces current sensory channels 0–3 with four odor bits (the last three encoded as 0/1), and channel 12 with original food proximity. Energy, wall response and previous experienced net intake remain accessible. The learner receives only current own observation, own energy and tick/body identity; its feature extractor excludes clock/phase labels. No valence, cue ID, codebook, oracle decision or fork label enters a learned policy. Cue-blind observations zero the cue; shuffled observations substitute a separately seeded independent cue at each own decision. These substitutions belong to the environment, not learner computation.

The two held actions control approach-and-feed versus avoidance-and-refusal. Steering uses the original food/wall sensory geometry; movement output is zero (speed fraction .5) and signals/mating are disabled. Avoidance turns away, while acceptance uses attraction. Harmful food removes its consumed amount from food inventory, damages body energy by up to that amount, and dissipates both consumed toxin energy and actual body damage. Damage is capped by available body energy. Beneficial food transfers into the body subject to the existing cap. Per-body receipts and the global conservation equation must both hold. Previous food feedback is signed net intake.

The engine changes are opt-in. The original ecology and its completed studies remain separate; no live habitat is resumed or promoted. The unfinished learner/probe interface exists for engineering tests only. Diagnostic collection contains zero learned worlds and zero probes.

## Locked experiment

The initializer captures sources, test sources, registered prior seed exclusions, prices and sixteen fresh histories before collection. Each history has a distinct body seed, cue assignment seed, four resource seeds, shuffle seed and null seed. All 128 new seed values must be mutually distinct and excluded from earlier registered protocols and conservative test integer literals. Collection, scoring and cold replay must execute the captured entrypoint and verify captured source/registry hashes. Files are exclusive, and resumption validates existing complete rows and trace hashes.

Eight arms each run 1,792 ticks or until extinction:

- `valueOracle`: knows the currently sensed hidden valence; evaluation only.
- `cueOracle`: knows the frozen random cue-to-valence codebook; evaluation only.
- `accept`: always approach/feed.
- `refuse`: always avoid/refuse.
- `random`: independently chooses either action with probability .5 every eight ticks.
- `shuffledOracle`: the cue oracle receives independently shuffled cues.
- `nullCueOracle`: cue lookup in a null world, where hidden valence is balanced within each cue and independent of the codebook.
- `nullRandom`: random controller in that same null world.

The 620 food patches give 155 per cue. Null groups therefore each have 78 positive and 77 negative patches, with spatial positions independently shuffled. That identical one-patch surplus is unrelated to the codebook label. Null equivalence is a bounded diagnostic, not a proof that every possible leakage channel is absent.

The all-founder endpoint is final surviving body energy minus initial body energy and unpaid compute debt, divided by all original founders. The fixed seven efficacy contrasts compare each oracle with accept/refuse/random, and cueOracle with shuffledOracle. The eighth comparison is nullCueOracle minus nullRandom.

Require all seven simultaneous two-sided Bonferroni t lower bounds to exceed zero, using `t.ppf(1-.05/(2*8),15)`. Require the null comparison's whole interval to lie strictly within +/-0.5 energy/founder: less than one .8-unit patch bite and less than 1% of initial 65-unit body energy. All six oracle-versus-fixed/random observed survival mean guards must be nonnegative. Report every effect and uncertainty. Sixteen histories are the sample size; founders/ticks are not independent replicates. The budget is 128 worlds and at most 229,376 collection world-steps. Cold replay and independent auditing repeat computation, not sampling.

Canonical prices remain `5e-6/17` energy per scalar work unit and `1e-5/(17*8)` energy per encoded byte-second. Full fixed state includes codebook where used, counters, RNG and held actuator. Primitive arithmetic costs six approach or nine avoidance units per tick; actual policy/lookup comparisons and random draws are counted separately. Constants/assignments are unpriced. Ambient sensors/scaffold run for every arm with ordinary engine costs. Report CPU/wall separately. This is a declared accounting model rather than JavaScript heap size or biological energetics.

## Audit and decision rule

Require exact JSON-level cold replay of all 128 worlds and exact factual trace hashes, preserving signed-zero serialization behavior explicitly. The independent Python checker reconstructs codebooks, every policy choice/random stream, primitive/policy work, canonical storage bills, paid/debt balances, every per-body energy receipt, global conservation, endpoints, contrasts and gate decisions. Its accumulated-arithmetic tolerance is 1e-8 absolute plus 1e-11 relative; that does not relax exact physical replay. Mutation tests must reject wrong choices, changed costs, altered work and missing body ledgers, and prove the audited selection is nonempty.

Any failed required gate closes advancement from this diagnostic. No candidate performance is available to select environment parameters. Do not tune assignments, run replacement histories, extend this sample or claim learning/retention/RSI from headroom. A different environmental design requires an explicit new prospective hypothesis and bank; this diagnostic stays failed if it fails.

Only after a pass and both audits may a separately fixed learning protocol proceed: shared finite synapses, actual cross-family active-synapse reuse and recorder overflow, acquisition versus frozen/reset/cue controls, separate A/B skills and 95%-advantage retention, whole-sequence energy/survival, null controls, original-ecology transfer, cold replay and independent learner arithmetic. Persistent autonomous algorithm revisions and copied-improvement/matched-budget search-productivity tests remain subsequent obligations.
