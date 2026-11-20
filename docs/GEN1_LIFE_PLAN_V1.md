# GEN1-LIFE PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why lifespan (toxin-proof by construction)
- Gen1-world NOGOd on the floor: net food sums cancel (toxins offset
  intake; triage +0.0001 vs run −0.0125 sign-unstable). Any intake-based
  Gen1 metric inherits the cancellation. Lifespan (ticks alive) cannot
  cancel: death is death, life is ≥1 tick, toxins shorten but never
  negate. It is also the fitness-relevant offspring read-out (survival,
  not net calories) and needs NO collector (lineage only — smaller
  instrument, smaller rows).
- Same world contrast (deep 1792 vs shallow 512 parental worlds, naive
  Gen1s, no weight copy anywhere), same matched founders (learn both
  arms), same bar-30/legacy/decoupled settings (proven births). The ONLY
  change from gen1-world is the metric (lifetime food-rate → lifespan);
  the floor that voided it cannot recur (lifespans are O(100s) ticks).
- Pre-registered reading: lifespan conflates starvation, toxins, and
  violence (all death is death) — it scores whether the WORLD matters
  for offspring survival, not which cause. Direction reported, causes
  not attributed.

## Design (2 arms × 2 histories = 4 mains)
- Arms: deep (1792 ticks) vs shallow (512 ticks). Both: founders learn
  (candidate), reproduction on, verticalTransmission 'none' (naive Gen1,
  NO copy), bar 30, legacy nutrients, decoupled. Emit null (no collector
  needed — lineage suffices).
- Metric: mean Gen1 lifespan = mean over generation-1 ((died ?? endTick)
  − born, clamped ≥1). Pure helper, fixture-tested.
- Bank: fresh-15, 474253–474270 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway shallow run on
  490055–490063 (added to spent, disclosed) proving births + finite
  lifespans BEFORE bank mint. Caps: BT. Single attempt. Disk floor
  1 GB (free ~1.05G; output <1M — smallest rows yet; stop if <1G).
- Verdict (pooled n=2, two-sided — the milestone is whether the WORLD
  matters): Gen1==0 anywhere → INCOMPLETE-NOBIRTHS (void, inherit
  precedent). Else GO (`GEN1-LIFE-GO-V1`) iff max/min pooled lifespan
  > 1.1 (either direction, reported); else NOGO
  (`GEN1-LIFE-NOGO-V1`). Offspring survival only; no transmission/
  transfer/RSI/population claim.
