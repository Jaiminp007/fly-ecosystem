# DAMAGE-GATE V1 NOGO (damage fires 2841× but moves nothing: D1 +0.015; surprise also flat on this bank; gate trigger is not the bottleneck)

Single authorized attempt-11: 15/0 mains/probes exact, `redone:[]`, ledger
26880 ticks / 645120 founder-slots / 2.42e9 ops (caps 300 exec / 20e9 ops /
3600s wall all held). Cumulative 7974 (+15).

## Gates (all pass)

G1 integrity all 15 rows (join ≥ 0.99) ✓ · G0 train gaps 0.82/0.809/0.829
(all ≥ 0.5) ✓ · G2a transferred-uniform mean 0.665 (≥ 0.3) ✓ · G2b unlearned
flat 0.001–0.003 (≤ 0.1) ✓ · null-hygiene clean (train/uniform/unlearned
all counters zero; gain arm damage-zero; damage arm surprise-replay-zero;
damage arm live-surprise 595 = shared live path by design) ✓ ·
damage-present 3/3 pairs (endpoint toxinDamage > 0) ✓ · usable 3/3.

## Headline (GO iff D1 mean > +0.1 with fired manipulation)

- D1 (damage − uniform HB flippedHB): +0.0827 / +0.0806 / −0.1191 →
  **mean +0.0147 → MISS → PHASE-D1-NOGO.** Manipulation fired hard
  (2841 replayDamageBoosts, all pairs).
- D2 (damage − gain HB): −0.0299 / +0.0003 / −0.0005 → mean −0.0100
  (parity — neither trigger beats the other because neither beats uniform:
  implied gain−uniform ≈ +0.025 despite 297 fired surprise boosts).
- Same-val diffs ≈ 0 all pairs (no erosion); mechanismConfirmedUniform true.

## Reading

The gate engaged exactly as built (damage-gated batches boosted 3×,
2841 times, on all 3 pairs with damage present) and changed nothing
(+0.015). Surprise-gating, re-tested as comparator on the same bank, also
changed nothing (≈ +0.025 with 297 fired boosts) — a fresh-bank
replication of the GAIN-DOSE lesson (bank variance eats small gates), not
a flaw in either trigger. Pair 3 went negative (−0.119) against a uniform
arm already at ceiling (0.829 transGap) — heterogeneity noted, no
concentration claim (1 pair, descriptive).

## Verdict

**PHASE-D1-NOGO.** The danger-theory prescription (gate on damage, not
novelty) is NOT supported as a seg1 deployment: a perfectly firing
damage gate is behaviorally inert here. Surprise-gating stays deployed
per V1i (standing, unreversed — this bank simply shows no edge for any
trigger). **Line CLOSED** per freeze: no damage-gated follow-up without
a new rationale (e.g., damage-gating where uniform itself fails, i.e. a
harder window than seg1-extinction; or threat-simulation replay, which is
a different instrument — prioritized, not licensed — see R128).
No RSI claim. All negatives preserved.
