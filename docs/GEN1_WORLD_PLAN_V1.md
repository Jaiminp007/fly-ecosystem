# GEN1-WORLD PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Do naive offspring forage differently in a deep-depleted parental world
vs a shallow (fresh-leaning) one — same naive weights (no copy), worlds
differ? Quantifies the WORLD effect to complement return-novel's WEIGHT
effect (same world, different weights).

## Why this cell (completes the dissociation)
- Return-novel: intact-vs-naive in the SAME fresh world → weights hurt
  (0.25 vs 0.49). Missing: naive in DIFFERENT worlds (depleted vs fresh).
  Together: weights×world 2×2 for naive (this line) + the intact side
  (return-novel + backward). If shallow-naive >> deep-naive, depletion
  strongly shapes naive foraging — the in-world benefit (intact-depleted
  > naive-depleted) is about coping WITH depletion, while fresh worlds
  ceiling everyone (return-novel naive 0.49 ≈ backward intact 0.49 —
  pattern noted, cross-bank, descriptive only).
- No weight copy anywhere (verticalTransmission 'none' both arms —
  every newborn naive; the transmission setting is the ABSENCE of
  transmission). Not gen1-taste (that varied DONOR; this varies WORLD
  with donor fixed at none). Not compound (no enrichment/window).
- Shallow = 512 ticks (A-phase depth — fresh-leaning, minimal depletion)
  vs deep = 1792 (full depletion). 512 is the shallowest horizon with a
  chance of births; bar lowered to 30 BOTH arms (disclosed deviation
  from gen1-taste's 50 — easier mating for short runs; identical across
  arms so the world-depth contrast is clean). Legacy nutrients (no
  override), decoupled mating, founders learn both arms (matched
  depletion behavior — only duration differs by design).

## Design (2 arms × 2 histories = 4 mains; Gen1-rate metric)
- Arms: deep (1792 ticks) vs shallow (512 ticks). Both: arm 'candidate'
  founders (learn), reproduction on, 'none' transmission (naive Gen1),
  bar 30, legacy. Collector sums per-agent lifetime food (observe
  lastFood); lineage gives generation/born/died. Metric: Gen1 mean food
  PER TICK ALIVE (lifetime food / lifetime ticks — normalizes
  lifespan/horizon; founders excluded, dead included).
- Bank: fresh-14, 474235–474252 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway shallow run
  (512 ticks) on 490046–490054 (added to spent, disclosed) proving
  births>0 + Gen1 rate computable at bar 30 BEFORE bank mint (the void
  risk lives in shallow births). Caps: BT. Single attempt. Disk floor
  1 GB (free ~2G; output ~1M; stop if <1G).
- Verdict (pooled n=2, two-sided — the milestone is whether the WORLD
  matters, direction reported): Gen1==0 anywhere → INCOMPLETE-NOBIRTHS
  (void, inherit precedent). Else GO (`GEN1-WORLD-GO-V1`) iff
  max(shallow,deep)/min(shallow,deep) > 1.1 (world matters either way);
  else NOGO (`GEN1-WORLD-NOGO-V1`) — depletion depth doesn't move naive
  foraging. No transmission/transfer/RSI/population claim.
