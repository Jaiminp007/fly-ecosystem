# ODOR DEV ROUND 9 — SCOPING V1 (distributional taste vs persistent pessimism)

Date: 2026-11-02. Status: SCOPING (not frozen; no code; no execution).
Licensed by: R8-NO-GO (`docs/ODOR_DEV_ROUND8_RESULTS_V1.md` — H8
falsified on all three prongs; fix (b) promoted).

## Motivation

R8 proved the attractor stronger than its cheapest fix: adaptive EMA
centering moved fractions (posfrac 5/8) but no mean flipped sign
(−0.36 to −1.43 everywhere), transfer went 4/8 noise, acquisition
paid the price. Centering shifts the background; it does not preserve
optimism — the centered error still teaches a single scalar whose
stationary point under 97%-negative experience is "bad". Fix (b):
stop averaging the bad away — represent the distribution, so optimism
survives in the upper quantiles even when the mean is negative
(Dabney precedent, queued since the diagnostic).

## Hypothesis H9

Distributional taste preserves usable optimism through the negative
flood: centered-distributional runs show (a) upper-quantile mass
above 0.5 on ≥6/8 histories (optimism EXISTS somewhere, even if the
mean stays low), (b) transfer-current beats R1-plain on ≥5/8, with
(c) an acquisition gate that is DIFFERENCE-based (R8 lesson: ratio
gates are null on negative-denominated energies — frozen into R9's
verdict, not repeated).

## Design (single-variable vs R1-plain)

- Curriculum: R1-plain (same 4 phases, same 8 reused histories — dev
  precedent; no fresh bank).
- One arm: distributional taste (K quantile heads, frozen K at freeze;
  quantile-regression update toward the supervised 0/1 target;
  behavior reads the mean — the behavior rule unchanged, the
  representation enriched). Everything else R1-plain literal.
- Comparator: spent R1 rows (read-only).
- Anchors: A + full probes (transfer-current decides; D-anchor sign
  audit extended with upper-quantile mass).

## Falsifier (fail-closed)

If transfer-centered-distributional ≤ R1-plain on ≥4/8 histories, OR
upper-quantile mass stays absent (no quantile >0.5 on ≥6/8), OR the
difference-based acquisition gate fails (centered-distributional
A-current below R1 A-current by more than the frozen margin on
≥3/8), H9 is FALSE: distributional insufficient → close R9, promote
fix (c) separate Go/No-Go matrices. No K re-tuning, no second attempt.

## Instrument shape (for the frozen plan, not this doc)

- `learning/odor-routed-taste.mjs`: K-headed taste state
  (`taste.quantiles`, null-default K=1 ≡ legacy scalar path
  bit-identical); quantile update billed uniformly (frozen N at
  freeze); behavior prediction = mean (unchanged rule).
- Runner `scripts/odor-routed-r9.mjs`: R1-plain curriculum clone, one
  arm + spent-R1 comparator, frozen scorer (transfer + quantile-mass
  audit + difference acquisition gate).
- Fixtures: quantile math (known-update recovery), null-default
  bit-identity (K=1 ≡ legacy), billing reconciliation.
- Caps: KEEP 40e9 ops / 3600s wall.

## What this round is NOT

- Not qualification (dev only; no fresh bank; never cited for RSI).
- Not fix (c) (stays queued; licensed only on NO-GO/PARTIAL here).
- Not a tweak of centering (α frozen at R8's values would be tuning;
  R9's instrument is disjoint — representation, not background).
- Not a rescore of R8 (NO-GO stands; near-misses stay misses).
