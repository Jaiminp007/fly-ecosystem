# Motor-anchor study — status (persistence file)

Objective: establish whether directional protection of the MOTOR readout
rescues A-retention, through a dev-gated study that spends no qualification
bank on a negative. Long-term objective: `docs/VISION.md` (milestone 2).
Basis: `docs/RETENTION_MECHANISM_RESULTS_V1.md` (SUPPORT-H1-motor, H1m
hypothesis, M-ACTOR recommendation) — not re-litigated here.

## Basis (inherited, not re-measured)

- R1 (100 probes, audited): taste-swap moves A-retention ~1e-6 (readout
saturated-correct, causally inert at probe time); motor-swap restores
near-atA levels 7/8. Probe-time retention variation is motor-determined.
- V3-Dev (228 executions, DEV-NOGO): rotation-damped anchor on the TASTE
readout moved weights below the greedy flip threshold (bit-identical energy
across λ) except harmful flips. Wrong stage (E4), not an incoherent
mechanism. Dev-gate pattern (dev bank, conjunctive bar, no qual on NOGO)
is reused verbatim.
- V6 `motorConsolidationRate` tested slow-target rehearsal (VOLUME) on the
motor side. M-ACTOR tests rotation-damped DIRECTION — never tried.
- H1m (associational): with predictions saturated-correct, A- and B-phase
contact decisions both route to motor block 1
(`tasteEnergyFeatures`: contact + prediction ≥ .5 → block 1); B-phase
`progressUpdate` steps overwrite the shared block-1 A-cruise policy.
Falsifier: A/B block-visit logs show disjoint blocks, or actor cruise
margins already saturated ⇒ H1m dead → ELSEWHERE (sensing line).

## Expenditure ledger (motor-anchor study)

- Worlds: 0 new (plan + status only).
- Seeds: 0 spent. No bank drawn.
- Cumulative program total unchanged: 5128 + 440 + 688 + 228 + 100.

## Next action

`docs/MOTOR_ANCHOR_PLAN_V1.md` FROZEN (Phase D only). Next: implement the
M-ACTOR instrument in `learning/taste-energy.mjs` (actor anchor, λ=0
bit-identity) + `scripts/motor-anchor-dev.mjs` (dev runner reusing the V3-Dev
pattern), fixture-test, freeze source hashes, then execute the single
authorized dev attempt. DEV-NOGO closes the line with zero qual spent; only
DEV-GO unlocks a separately frozen Phase-Q (never in this goal).
