# GEN1-GIVE PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why redistribution (information sharing failed; food sharing untested)
Share V1: saturated alert changed nothing (0.563 tie) — range cannot
create food; the tail is sufficiency, not discovery. Untested: actual
FOOD redistribution (zero-sum — moves existing energy, creates none).
If losers die short of costs while winners eat surplus, need-directed
transfer should lift the tail (variance reduction with concave
survival); if donors are themselves marginal, sharing deepens the
deficit (both starve). The run decides which.
- STATED RULE (one): "After each tick, for every alive agent with
  intake (lastFood) > 0, move HALF of that meal to the lowest-energy
  among its 3 nearest alive neighbors (ties: nearest) — but only if
  that recipient's energy is below the donor's post-meal energy
  (down-gradient only; if the donor is neediest it keeps the meal).
  Transfer is free (no fee) and zero-sum (donor −half, recipient
  +half — world total unchanged, no books adjustment, conservation
  holds trivially). Recipients are by construction hungry (lowest
  local energy), so no 120-cap overflow. Frozen behavior untouched
  (post-step energy surgery only, like pacing caps)."
- Arms (3 × 2 histories = 6 mains): GIVE (fresh-clean-24 + transfer
  rule) vs ASOCIAL (fresh-clean-24, no transfer) vs DEEP
  (depleted-toxic-24 frozen verbatim — bank-viability + world
  reference, descriptive). Same naive placement (init-copy + clear +
  freeze + energy48 + re-baseline) + same per-agent intake+cost
  metering (plus received sums per agent — who got how much; zero-sum
  check sum(received)==sum(given)) + loser splits + causes + exact
  ledgers + transfer ledger (total moved, count). Reproduction off,
  mutation off. Scored comparison is give-vs-asocial.
- Verdict: total transferred == 0 → INVALID (rule inert — no meals
  met a needier neighbor). Else GO (`GEN1-GIVE-GO-V1`) iff give
  survival > asocial ×1.1 (redistribution lifts the tail — fewer
  deaths). Else NOGO (`GEN1-GIVE-NOGO-V1`). UNDER counts + received-
  vs-survival corroborate descriptively (did the fed survive?).
  No transmission/transfer/RSI/population claim.
- Bank: fresh-27, 474469–474486 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway give run
  (256 ticks) on 490145–490153 (added to spent, disclosed) proving
  transfers fire regularly + conservation exact (zero-sum) + completion
  BEFORE bank mint. Caps: BT. Single attempt. Disk floor 1 GB
  (free ~4G; output ~1.5M).
