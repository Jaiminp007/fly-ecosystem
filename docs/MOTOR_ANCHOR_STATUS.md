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

## Instrument (built + fixture-tested, unexecuted)

- `learning/taste-energy.mjs`: `motorAnchorRate`/`motorAnchorStrength` (opt-in,
  default 0 = Gen1 bit-identical, pinned by fixture); `slowMotorDir` (96-dim)
  checkpointed/restored/reset/validated; rotation-only pull
  `anchorActorDirection()` applied in `motorUpdate` admitted steps and
  `progressUpdate`; all ops billed through `m`. `progressUpdate` newly
  exported (one word, no behavior change) for fixture access.
- `learning/taste-experiment.mjs` + `learning/taste-pressure.mjs`: opt-in
  `emit` threaded through `runTasteProbe`/`runTastePressureBattery`
  (null-default, behavior-identical); A-probe events tagged by probe key.
- `scripts/motor-anchor-dev.mjs`: dev runner (V3-Dev pattern); 4 histories x
  6 arms N-only; actor alignment; margin/block collector riding the same
  executions; six-condition `motorGoNoGo`; analytic `rescoreMotorAnchorDev`.
- Fixtures: `tests/motor-anchor.test.mjs` 6/6 + `tests/motor-anchor-dev.test.mjs`
  5/5 green (synthetic seeds 378001+, tmpdir bank; no worlds, no banks).
- Regression: all suites covering touched code pass 24/24. Full-suite
  closure/audit exact-replay failures (13-22, varying run to run) are
  PRE-EXISTING environment drift — the pristine tree fails MORE (22) than
  the modified tree (13); `body-transfer-dev.test.mjs` fails at file level
  pristine yet passes with the change (flaky, unrelated).

## Verdict (executed 2026-10-28, audited, FROZEN)

Single authorized attempt: `evidence/motor-anchor-dev/attempt-01/`.
228 executions (72 mains + 156 probes), 168,960 world-ticks, 4,055,040
founder-slots, 9,702,658,421 scalar ops (cap 90e9). Bank
`fresh-01/protocol.json` (`fccc7e36…`), 36 unique fresh seeds.
Best-λ (0.08) Δ vs control: dA −0.292 (bar +0.15 FAIL), dB +0.077 (pass),
dL −0.631 (bar −0.20 FAIL), alignUp true (pass, near-definitional),
margin bars no-data → fail-closed. **DEV-NOGO**, over-determined by the
behavioral bars. Full record: `docs/MOTOR_ANCHOR_RESULTS_V1_DEV.md`.
Audit: independent raw-row recompute matches on all estimands (<1e-9);
anchors 12/12; snapshots match frozen sources; ledger exact.

Two instrument notes (preserved, not repaired — single attempt spent):
(a) probe-side margin collector recorded zero events in all 12 rows
(D1 unanswered; diagnosing needs spent-bank steps or new-bank worlds —
both forbidden); (b) one 8-tick synthetic plumbing main on seeds
379001–379009 (anchor null) is ledgered as fixture verification and
union-excluded via `evidence/motor-anchor-dev/fixture-seeds-01.json`.

H1m premise descriptively SUPPORTED (block 1 shared ~10k visits/phase)
yet directional protection still fails → M-ACTOR line exhausted.
Taste-anchor (V3) null, motor-anchor harmful. Fall-through: ELSEWHERE
sensing line or H2 body-structure — neither launched here.

## Expenditure ledger (motor-anchor study)

- Worlds: 228 dev + 1 synthetic fixture main. Seeds: 36 dev (spent) +
  9 synthetic fixture (spent, excluded) + unit-test literals (scanned).
- Cumulative program total: 5128 + 440 + 688 + 228 + 100 + 228 + 1 = 6812.

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
