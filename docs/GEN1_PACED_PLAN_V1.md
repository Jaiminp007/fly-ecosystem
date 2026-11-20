# GEN1-PACED PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why duty-cycle pacing at the deep rate (feast left rate untested)
- Feast V1: no gorge (flat ~25/bin then fade) — but exhaustion RATE was
  never tested. Per-agent gross intake (net+toxin, read-only from feast
  rows): fresh ~0.025/tick vs deep ~0.018/tick (only 1.4× apart — the
  stock gap is mostly agent-count × time, not per-agent greed). Capping
  fresh at the deep rate (×2/3 duty) tests whether exhaustion speed is
  the killer: slower draw → crash delayed past the horizon or not.
- Duty 2/3 (food hidden every 3rd tick, visible 2/3 → ~0.017/tick,
  deep-matched): hide = store per-patch amounts + zero them pre-step,
  restore post-step (eaten stays eaten, hidden preserved — no food
  created/destroyed except by the engine; regrowth leak on hidden ticks
  is small and measured in the capped rate). Cues/contacts intact —
  agents navigate normally, only intake gated. No engine change.
  Finding-limited intake (~0.025 << 0.8 max) means no compensatory
  gorging headroom on visible ticks (verified by the manipulation
  check). Frozen naive — no learning confound.
- Vessel: fresh-clean-24 (toxin-free, same stock/minds as feast —
  new bank, new measurand (rate-gating), no contrast repeated).
  Reference: deep-toxic-24 depleted verbatim + concurrent uncapped
  fresh-clean-24 (vessel validation, expected ~0.75).

## Design (3 arms × 2 histories = 6 mains; rate test)
- Capped: fresh-clean + duty-2/3 pacing during the 1792 measure only.
  Uncapped: fresh-clean, no pacing. Deep: 1024 deplete + same placement,
  no pacing (truncates ~768, disclosed conservative). All: same naive
  placement (init-copy + clear + freeze + energy48 + re-baseline) +
  same metering (per-agent toxin/food sums + binned energy + cause
  tables + exact death ledgers) + per-32-tick intake series (manipulation
  + shape texture). Reproduction off.
- Rate metric: per-agent-tick gross = (food_sum + toxin_sum)/n/ticks
  (clean arms toxin=0 so gross=net; deep adds its drain back).
- Bank: fresh-23, 474397–474414 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway capped run
  (256 ticks) on 490109–490117 (added to spent, disclosed) proving
  completion + capped intake ~2/3 of uncapped triage (~27–29/bin →
  ~18–19/bin) BEFORE bank mint. Caps: BT. Single attempt. Disk floor
  1 GB (free ~4G; output ~1.5M).
- Verdict (pooled n=2): capped gross > uncapped×0.8 → INVALID (pacing
  failed — compensated or leaked). Else GO (`GEN1-PACED-GO-V1`) iff
  capped survival ≥ deep×0.9 (slower exhaustion rescues to deep level).
  Else NOGO (`GEN1-PACED-NOGO-V1`) — rate isn't the driver (crash is
  threshold/inevitable, not speed-driven). No transmission/transfer/
  RSI/population claim.
