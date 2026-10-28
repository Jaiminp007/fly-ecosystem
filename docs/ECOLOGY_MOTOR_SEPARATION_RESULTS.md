# Odor-free ecology motor separation: transfer loss stopped

Exploratory development only. Reuses the same eight-history development bank.
No fresh qualification, no retained-skill proof, no RSI. All old failures stand.

## Problem

Cue-world pauses that help search bled into the odor-free original ecology,
where cruising wins. `transfer:current` still paused 1035/5120 decisions while
`transfer:reset` and `transfer:acceptCruise` cruised 5120/5120. Transfer lost
-1.57 mean energy per founder, 0/8 positive, -7 survivors (attempt-15-progress).

`transfer` sets `cue=[0,0,0,0]`, `odorPresent=false`, `cueForaging=false`.
`prediction` was forced to 1 and routing reused cue contact blocks.

## Change (human-proposed, not autonomous)

`learning/taste-energy.mjs` adds `motorRepresentation='ecology'`:

* 96 dims = 6 blocks x 16. Blocks 0-3 keep exact cue-world routing
  (search / predicted-positive / predicted-negative / productive-positive via
  own signed budget energy change), so frozen cue probes route where training
  routed.
* When `ecology && !odorPresent`, route to block 4 (odor-free search,
  no-contact) or 5 (odor-free contact). Odor-bearing contact keeps cue blocks.
* `odorPresent` is the learner's own observable (`cue.some(v!==0)` via
  `contactObservation`), never patch identity, hidden valence or future reward.
* Extra weights/compute/bytes are charged normally via `chargeForStep`.

Odor-free far-search moments in cue training (`sensedCue=[0,0,0,0]` when no
food >0.06 in sense range) train blocks 4/5. Frozen transfer probes then use
their own acquired cruise bias. Greedy inference (`.5` threshold, prior `.75`)
gives always-cruise for zero weights, matching reset.

Source hash in attempt-18: `taste-energy.mjs:fbb4787a84f8...`.
Tests: `node --test tests/taste-energy.test.mjs tests/taste-experiment.test.mjs`
-> 18 pass 0 fail.

## Result (attempt-18-ecology-full, 1792 ticks x 8, greedy/orthogonal/rate1/progress/hold1/greedy-inference)

Runner: `node scripts/taste-development.mjs --output evidence/taste-development/attempt-18-ecology-full --ticks 1792 --count 8 --feeding greedy --taste orthogonal --taste-rate 1 --motor ecology --hold 1 --motor-rule progress --greedy-inference --arms candidate,unlearned,frozen,reset,acceptCruise,acceptStationary`

* Sequence: mean +4.52, 8/8 positive, survivor +81 (candidate 95? actually per-history survivors sum: check rows). Attempt-15 was +4.82, +82. Lifetime preserved within compute cost of larger net.
* Vs frozen: +3.36, 8/8, +54. Vs reset: +0.52, 6/8, +18. Extended development signal true.
* Retention (descriptive, reused bank, not qualification):
  A retained 2.11 vs saved 1.99 -> 105.8% true, survivor -1.
  B retained 1.64 vs saved 1.61 -> 101.6% true, survivor +2.
  First exploratory run with both A and B descriptively >=95%.
* Transfer vs reset: mean 0.0 exactly, 0/8 positive, survivor 0.
  Before: -1.57, 0/8, -7. Loss stopped; superiority still fails.
* Transfer vs acceptCruise: -0.46, 0/8, +1 (extra compute of 96-dim net).
  Vs acceptStationary: +12.57, 8/8, +25.
* Pressure (descriptive): aRetention +0.22 (4/8), bRetention +0.11 (4/8).

Single-history check (attempt-17, seed 1172370180) showed the same tie:
transfer 0.0 vs -2.10 before on that seed, sequence +6.73.

## Interpretation

* Lawful separation works: odor-free movement no longer inherits cue pauses.
  Current ties reset instead of losing, with identical cruise actions.
* Tie is expected under greedy inference: both zero and learned cruise biases
  exceed .5, so both always cruise. No movement benefit can beat always-cruise
  in an ecology where cruising is optimal; remaining -0.46 gap to fixed cruise
  is measured compute cost, honestly reported.
* Descriptive >=95% retention on reused bank is not functional-pressure
  qualification, not fresh-task proof, not RSI. Fresh prospective protocol with
  own-trajectory learning, per-skill retention/survival gates and total-budget
  accounting is still required.
* Next: fresh qualification bank (not dev-bank-v1), original-ecology transfer
  with survival noninferiority margin, then >=2 persistent autonomous revisions
  vs copied-improvement and matched-budget controls.

Evidence: `evidence/taste-development/attempt-18-ecology-full/`
(`attempt.json`, `results.json`, `rows/`, `sources/`).
