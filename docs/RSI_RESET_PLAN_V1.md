# RSI-RESET PLAN V1 — FROZEN (self-proposed targeted reset + transfer eval)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~4G at freeze).

## Rationale (new proposal family, not a menu variation)
V1/V1b/V1c closed the rate/freeze loop-transfer contrasts with a common
mechanism: train-phase learning overfits to the train layout (basin-
trapping), so transplanted weights transfer worse than init. No line has
ever proposed a SELECTIVE reset — C-series tested rate/gain/skip/surprise/
sparse/double externally (all 0-transfer), V1b tested rate/gain/margin
internally, the reset arm resets EVERYTHING (imposed, ceiling = tie with
unlearned). Targeted forgetting (reset actor-only / critic-only / taste-
only, keep the rest) is a different update geometry addressing the
diagnosed failure directly: remove the overfit component, keep the skill.
If any component-reset transfers above unlearned, a self-proposed change
beats never-learned for the first time; if all fail, the overfit is not
component-local (or init+relearning is simply the better optimizer) and
the product gap stands on a fourth eval family. Bar note (disclosed, not
evaded): this is a new proposal family (targeted forgetting, never
proposed anywhere), not a re-tune of a tested menu; a NOGO here extends
the C-bar to cover it.

## Design (frozen; V1 transfer scaffold, new proposal core)
- Instrument: `scripts/rsi-reset-dev.mjs` (new; V1's train/probe/scorer
  scaffold copied, proposal core new). 2 pairs × (3 trains + 3 transfer
  probes) = 12 mains, ZERO probes, no reproduction, BT ticks/caps,
  legacy nutrients. Arms: selfmod (reset-proposer) / fixed (learns,
  never proposes) / unlearned (never learns).
- Proposal (new, fixture-tested pure core + thin driver wrapper):
  per founder at checkpoints {512,1024,1536}, sandbox fit/test split
  (V1a record slicing: fit = last ≤32 before last 8, test = last 8;
  skip if store < 16 — identical gates), candidates = {incumbent} ∪
  {reset-actor, reset-critic, reset-taste} applied to sandbox clones
  (weights zeroed + corresponding eligibility cleared, mirroring
  resetTasteEnergyBody; replay fit records via tasteUpdate; err on
  test via tastePrediction). Adopt best iff errCand < errInc × 0.99,
  else keep. One decision per agent per checkpoint max (bounded).
  Flat fee per candidate evaluated: 2·(fitN+testN)·(D+1), billed live
  (same formula as V1a — cross-line billing parity).
- Transfer probes: V1-identical (transplant train-final weights at
  adopted-or-default rate... NOTE: rate is NEVER adopted in this line
  (no rate dials); probe rate = default 1.0 for all arms — the change
  under test is weights-only by construction, which is exactly the
  reset hypothesis). Digest match + integrity enforced.
- Bank: `evidence/rsi-transfer-dev/fresh-04/` 473244–473279 (4 × 9 =
  2 pairs), verified clean pre-freeze (0 exact hits evidence + tracked),
  builder re-gates at mint. First use is the single run.
- Fixtures (new `tests/rsi-reset-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, selective-reset purity (only target
  component zeroed, eligibility cleared, rest intact — synthetic
  learners), proposal branches (adopt-best/reset-actor/critic/taste,
  keep, skip, tie-tolerance) on synthetic stores, scorer GO/NOGO/VOID
  on synthetic rows, transplant digest round-trip, zero-tick wiring.
  Triage-analogue = zero-tick (no worlds pre-run).
- Caps: V1 values; expected output <8M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (all prior lines stand).

## Gates (frozen)
- G1: ledger exact (12 mains / 0 probes) + train phaseRows complete or
  clean-extinct (V1b precedent) + transplant digests match + config audit
  (probe rate 1.0 all arms; no rate proposals exist in this line).
- Verdict: zero reset-adopts → INCOMPLETE-NORESET (void — without an
  adoption the contrast is vacuous); else mean(selfmod_te) >
  mean(fixed_te) AND > mean(unlearned_te) → GO (self-proposed targeted
  reset transfers; thin n=2, licenses replication ONLY); else NOGO with
  stop-rule analogue.
- Scope: NO successive-revision/RSI/retention/population claim.
  Descriptive only: per-component adopt counts, per-pair tables,
  adopted-component breakdown.
