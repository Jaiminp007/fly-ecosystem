# GEN1-FEAST PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why a time-series (density left the shape unmeasured)
- Density V1 proved the residual is food-limited (low 1.00 vs lowm 0.75,
  all energy-deaths) — but never showed the dynamics: is it a sharp
  feast-then-crash (early overconsumption → depletion → collapse) or a
  slow grind (steady attrition)? Per-agent died ticks (lowm ~1621–1733,
  very late) suggest a late crash, but intake/energy shapes were never
  measured. This line meters them directly: per-32-tick bins of total
  intake + mean alive energy + alive count, full course.
- Vessel: fresh-clean-24 (toxin-free, the original residual population
  0.73 — new bank, new measurand (shape series never recorded), no
  contrast repeated; toxic arms would confound intake with damage).
  Reference: deep-toxic-24 depleted verbatim (steady-state control +
  bank viability). Matched observation: feast ratios computed over the
  first 768 measure ticks in BOTH arms (equal footing); crash (deaths +
  energy collapse) over the full fresh 1792 with shape/rate metrics
  only (no cumulative sums — drain-lesson applied, disclosed).
  Deep truncates at 768 by auto-finish (censored-high, conservative).

## Design (2 arms × 2 histories = 4 mains; shape verdict)
- Fresh-clean-24: clean codebook swap (re-lay + run.codebook, frozen
  reuse) + same naive placement (init-copy + clear + freeze + energy48
  + re-baseline) + series metering, 1792 ticks. Deep-toxic-24: 1024
  deplete + same placement + same metering (truncates ~768).
  Series: per-32-tick bins {intake (sum of alive lastFood, net),
  energyMean (alive mean at bin end), alive (count)} + existing
  per-agent toxin/food sums + cause tables (died ticks validate crash
  timing) + exact death ledgers. Reproduction off.
- Pre-registered shape criteria (mechanism-set, falsifiable):
  feast = mean(intake bins 0–7, ticks 0–256) ≥ 2× mean(bins 16–23,
  ticks 512–768) (zero-floor: if both means <0.01 → flat, no feast);
  crash = ≥2 deaths over full 1792 AND mean-alive-energy(last 128)
  < 60% of max bin mean; deepGate = deep feast-ratio <2.5 (same
  zero-floor) AND deep survival ≥0.8 (tolerant — allows the 1/24 late
  death; depletion failure → INVALID, not a world result).
- Bank: fresh-22, 474379–474396 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway fresh-clean-24
  series run (256 ticks) on 490100–490108 (added to spent, disclosed)
  proving completion + zero toxin + populated series BEFORE bank mint.
  Caps: BT. Single attempt. Disk floor 1 GB (free ~4G; output ~1.5M —
  series are small arrays).
- Verdict (pooled n=2): deepGate fails → INVALID (depletion broken —
  mechanism untested). Else GO (`GEN1-FEAST-GO-V1`) iff fresh feasts
  AND fresh crashes (boom-bust dynamics present in fresh, absent in
  depleted). Else NOGO (`GEN1-FEAST-NOGO-V1`) — no boom-bust shape
  (slow grind or flat — contradicts the density reading).
  No transmission/transfer/RSI/population claim.
