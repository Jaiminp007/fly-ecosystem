# ODOR DEV ROUND 10 — SCOPING V1 (split Go/No-Go matrices vs optimism-without-transfer)

Date: 2026-11-02. Status: SCOPING (not frozen; no code; no execution).
Licensed by: R9-NO-GO (`docs/ODOR_DEV_ROUND9_RESULTS_V1.md` — H9
falsified on all three bars; fix (c) promoted).

## Motivation

R9 moved the weights further than any prior round — five histories
positive means, top upper-mass 0.85 — and transfer still went 4/8
noise, with two positive-mean histories losing and one negative-mean
history winning. The dissociation is now measured: optimism in the
palate does not entail carriage in behavior. Both fixes so far
(centering the background, enriching the representation) operate on a
SINGLE pathway that sees the full 97%-negative flood. Fix (c):
stop forcing positives through the flood — separate consequence
matrices (Bogacz precedent, queued since the diagnostic), where the
Go matrix learns ONLY from positive records and never sees a 0.

## Hypothesis H10

Split matrices preserve positive learning where the negative flood
doesn't reach: Go-head weights stay positive on ≥6/8 histories (the
positive lesson is actually learned, not averaged), No-Go head
absorbs the flood, behavior reads their difference — and transfer
lifts on ≥5/8 with acquisition preserved (difference-based gate).

## Design (single-variable vs R1-plain)

- Curriculum: R1-plain (same 4 phases, same 8 reused histories — dev
  precedent; no fresh bank).
- One arm: split taste (Go matrix updated on target=1 records only,
  No-Go on target=0 only; behavior prediction from their difference;
  exact combination frozen in the plan). Everything else R1-plain
  literal (baseline off, quantiles off — R10's instrument is disjoint
  from R8's and R9's).
- Comparator: spent R1 rows (read-only).
- Anchors: A + full probes (transfer-current decides; D-anchor audit
  reads Go-head positivity + No-Go flood-absorption separately).

## Falsifier (fail-closed)

If transfer-split ≤ R1-plain on ≥4/8 histories, OR Go-head means
stay non-positive (≤0 on ≥6/8 — the positives still didn't learn),
OR the difference-based acquisition gate fails (split A-current
below R1 A-current by more than the frozen margin on ≥3/8), H10 is
FALSE: split matrices insufficient → close R10. Fix (c) was the last
of the three specified fixes (centering / distributional /
separate) — no (d) is pre-licensed; failure returns the program to
the shelf and the diagnostic (new rationale required, same bar as
C17: genuinely new, not a variation).

## Instrument shape (for the frozen plan, not this doc)

- `learning/odor-routed-taste.mjs`: Go/No-Go weight matrices
  (`taste.goW`/`taste.nogoW`, null-default single-matrix ≡ legacy
  path bit-identical); target-routed updates (1→Go, 0→No-Go); behavior
  from the difference (frozen formula); billed uniformly (frozen N).
- Runner `scripts/odor-routed-r10.mjs`: R1-plain curriculum clone, one
  arm + spent-R1 comparator, frozen scorer (transfer + Go-positivity
  audit + difference acquisition gate).
- Fixtures: routing math (1→Go-only, 0→No-Go-only, exact weights),
  null-default bit-identity (single matrix ≡ legacy), billing
  reconciliation.
- Caps: KEEP 40e9 ops / 3600s wall.

## What this round is NOT

- Not qualification (dev only; no fresh bank; never cited for RSI).
- Not a combination with centering/quantiles (disjoint instrument;
  R8/R9 spares stay parked, never stacked without their own freeze).
- Not a rescore of R8/R9 (both NO-GOs stand; near-misses stay misses).
