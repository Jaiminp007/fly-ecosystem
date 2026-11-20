# GEN1-TASTE PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Do first-generation offspring that inherit the most-prolific founder's
weights (copybest, exact) forage better than unlearned offspring (naive),
scored on the taste edge (lifetime food)?

## Why this setting (not mutated maternal, not compound window, new datum)
- Maternal-exact scored (inherit V1, births-gap NOGO-ish); mutated
  maternal scored (lineage/V1b); compound window scored-failed (zero Gen2);
  copybest scored only for Gen2 COMPOUNDING (social V1 NOGO — encounters,
  not content). NO line ever scored Gen1 FORAGING under any transmission:
  social V1's Gen1s were born but only Gen2 counted. This is the untested
  cell (offspring taste, not lineage compounding) under an untested
  combination (copybest donor × legacy/decoupled birth conditions —
  copybest previously ran only enriched; legacy avoids compound's window
  by construction).
- Rationale (genuine, narrow): the donor is the most-prolific founder
  (engine definition: max founderOffspring — fitness-weighted, exact
  copy, no noise). Prolificacy needs energy needs foraging, so the donor
  weights plausibly carry foraging skill; naive offspring are the exact
  control (same worlds, same founder learning, only offspring weights
  differ). A GO would show transmission content matters for taste even
  though it doesn't for compounding (different bottleneck); a NOGO would
  extend social V1's neutrality from compounding down to foraging.
- Matched-founder design (precedent: retention-live): BOTH arms' founders
  learn (candidate program) so depletion trajectories match; only the
  newborn weights differ (best-copy vs naive). The contrast isolates
  offspring weight content.

## Design (2 arms, 2 histories, 4 mains)
- Arms: copybest (verticalTransmission:'copybest', transmissionNoise
  null) vs unlearned ('none'). Both: arm 'candidate', reproduction true,
  matingActionRequired false, matingEnergyBar 50 (inherit-V1 proven-birth
  pattern), nutrient LEGACY (no override — not the compound window),
  BT learner options/pricing, BT_TICKS 1792. No probes.
- Collector (in-run, memory only): foodByAgent[agentId] += lastFood on
  observe events; lineage (world.lineage) maps id→generation. Metric:
  mean lifetime food per Gen1 agent (founders/Gen2+ excluded; dead
  included via lifetime sums). Stored per row (means only, no event dump).
- Bank: fresh-10, 474145–474162 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway copybest run on
  490028–490036 (added to spent, disclosed) proving births>0 + Gen1 food
  finite BEFORE bank mint. Caps: BT ticks/wall/op. Single attempt.
  Disk floor 1 GB.
- Verdict (pooled n=2): Gen1 == 0 in either arm →
  INCOMPLETE-NOBIRTHS (void, inherit precedent — mechanism untested).
  Else GO (`GEN1-TASTE-GO-V1`) iff pooled copybest-Gen1-food > pooled
  unlearned-Gen1-food ×1.1; else NOGO (`GEN1-TASTE-NOGO-V1`). Offspring
  taste only; no Gen2/population/RSI claim.
