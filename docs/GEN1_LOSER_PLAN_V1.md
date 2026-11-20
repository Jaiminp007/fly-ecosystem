# GEN1-LOSER PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why per-agent intake-vs-cost (paced left the losers unsplit)
Paced V1: capping hurts (0.15 vs 0.50) — per-tick balance, not speed.
But WHO dies was never split: agents who never reach food (discovery
failure — intake ≈ 0) vs agents who reach it yet eat below cost
(insufficiency — intake > 0 but < costs). This line meters both sides
per agent: lifetime intake (food sums, clean = gross) AND lifetime
costs (engine `lastEnergyCost` accumulated per tick — same read-only
receipt pattern as intake/damage) against starting 48. Balance closes
(48 + intake − costs ≈ live energy — validated descriptively).
- Vessel: fresh-uncapped-clean-24 (toxin-free, same stock/minds as
  feast/paced — new bank, new measurand (cost side never recorded),
  no contrast repeated). Reference: deep-toxic-24 depleted verbatim
  (bank-viability; its 1–3 deaths reported only — too few to split).
- Pre-registered split (dead agents only, within-run survivor median
  as the reach reference — bank-robust): NEVER = per-lived-tick
  intake < 0.1 × survivor-median per-tick intake (order of magnitude
  below successful foragers — never found food). UNDER = not NEVER
  and lifetime intake < lifetime costs (found but insufficient).
  OVER = not NEVER and lifetime intake ≥ lifetime costs (died despite
  lifetime surplus — cap-waste (120 cap) + late crash, or timing; real
  category, counts toward mixed). Lived ticks = died tick (dead) /
  ranTicks (survivors).
- Scored on FRESH dead only (the loser fraction): GO-NEVER
  (`GEN1-LOSER-GO-NEVER-V1`) iff NEVER ≥ 2/3 of fresh dead
  (discovery failure dominates). GO-UNDER
  (`GEN1-LOSER-GO-UNDER-V1`) iff UNDER ≥ 2/3 (insufficiency
  dominates). Else NOGO (`GEN1-LOSER-NOGO-V1`) — mixed (no 2/3) or
  OVER-heavy (dichotomy fails). Fresh dead < 4 → INCOMPLETE-NOLOSE
  (void — too few losers to split; the question needs deaths).

## Design (2 arms × 2 histories = 4 mains; loser split)
- Fresh-clean-24 (uncapped, no pacing) 1792 ticks + deep-toxic-24
  (1024 deplete, truncates ~768, disclosed conservative). Same naive
  placement (init-copy + clear + freeze + energy48 + re-baseline) +
  extended metering (per-agent toxin/food/cost sums + binned energy +
  series + cause tables + exact ledgers). Reproduction off.
- Bank: fresh-24, 474415–474432 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway uncapped run
  (256 ticks) on 490118–490126 (added to spent, disclosed) proving
  cost sums populate + balance closes approximately (48+in−cost ≈
  live energy) + categories compute BEFORE bank mint. Caps: BT.
  Single attempt. Disk floor 1 GB (free ~4G; output ~1.5M).
- No transmission/transfer/RSI/population claim.
