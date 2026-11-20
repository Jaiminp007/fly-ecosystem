# RSI-RESET AMENDMENT A1 — single-option taste reset (pre-run correction)

Date: 2026-11-03. Status: FROZEN (pre-run; part of the frozen design).
Parent: `docs/RSI_RESET_PLAN_V1.md` (unchanged except as amended here).

## Finding (zero worlds; code reading + V1a pattern)
The V1a sandbox evaluates candidates by replaying fit records through
`tasteUpdate` and scoring `tastePrediction` error. `tasteUpdate` touches
taste weights only — actor/critic weights evolve exclusively in
`motorUpdate` (live observe path, never replayed). A sandbox therefore
CANNOT distinguish an actor/critic reset from the incumbent (identical
replay trajectory, exactly tied error, never adopted): 2 of the 3 menu
options in the parent plan are dead by construction, not by evidence.

## Amendment (design change, same bar/gates/question)
Proposal menu collapses to the single live option: reset-taste
(zero taste weights; motor/eligibility untouched except taste has no
trace). Rationale tightens rather than weakens: mate-decomp just proved
taste (not motor) drives the reproductive edge, so the overfit — if any —
lives in taste weights, and the sandbox CAN see it (reset taste changes
replay trajectory). Everything else in the parent plan stands unchanged:
checkpoints, fit/test split, skip rule, adopt iff best < incumbent×0.99,
flat fee (now 2·(fitN+testN)·(D+1) — one incumbent + one candidate, same
formula as V1a), checkpointing, transfer eval, GO/NOGO/VOID bars,
single attempt, no rescoring. `compCounts` now documents the single
option's firing rate.
