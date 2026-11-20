# GEN1-DRAIN PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## What gets metered (toxin load as a datum, not a reading)
- Gen1-placed showed identical naive minds survive 0.917 depleted vs 0.0
  fresh; gen1-cause ruled OUT acute killing (zero deaths ≤256 both arms)
  and left chronic toxin-drain vs starvation open (intake-parity reading,
  unmeasured drain). This line meters the drain DIRECTLY: per-agent,
  per-tick toxin damage (`run.lastDamage`, engine-recorded receipts,
  non-negative by construction — nothing to cancel) accumulated over
  the full 1792-tick measure, plus per-agent food (same loop) and
  binned energy trajectories (drain effect). If fresh loads >> depleted
  toxin AND fresh dies while depleted lives, chronic toxin load is a
  datum (exposure + temporal order + survival), not a reading.
- Same placement verbatim (init-copy + clear + freeze + energy48 +
  re-baseline; V1 transplant op; re-use protocol identical): the ONLY
  additions are (a) advancing the measure phase tick-by-tick with
  per-agent reads (same world-steps, read-only metering — no mechanism
  change), (b) cumulative toxin/food ledgers + binned energy curves per
  agent, (c) per-agent born/died table (cause-line precedent). Same
  histories shape (fresh-19), same arms, same ticks/caps.
- No weight copy (init-to-self, zero learned bits); reproduction off;
  founders learn only in the deep deplete-phase (matched to placed V1).

## Design (2 histories × 2 arms = 4 mains; metering, not new worlds)
- Deep: advance 1024 (deplete, bulk — unmetered) → placeNaive → 1792
  single-tick advances, each tick accumulating per-agent toxinDamage +
  lastFood and (every 64th) energies. Fresh: place at 0 → same 1792
  per-tick metering. Break early if world finished (extinct — record
  actual ticks; no censoring issue: death IS the endpoint, survivors
  censored at end identically both arms).
- Metric (primary, pre-registered): pooled mean cumulative toxin per
  agent, fresh vs deep. GO (`GEN1-DRAIN-GO-V1`) iff fresh > deep ×1.1
  (measured chronic load gap). Else NOGO (`GEN1-DRAIN-NOGO-V1`).
  Descriptive (same run): survival (placed-replication check), median
  death tick, energy curves, cumulative food parity, death causes.
  No void branch (sums always finite; all-zero both → NOGO).
- Bank: fresh-19, 474325–474342 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway run (deplete
  128 + place + 128 metered ticks) on 490073–490081 (added to spent,
  disclosed) proving the per-tick read path + finite sums BEFORE bank
  mint. Caps: BT. Single attempt. Disk floor 1 GB (free ~2–4G;
  output ~1–2M with binned trajectories; stop if <1G).
