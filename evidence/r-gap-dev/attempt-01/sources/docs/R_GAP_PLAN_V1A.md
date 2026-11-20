# R-GAP plan amendment V1a (grid arithmetics + exact configs + S2 instrument)

Frozen 2026-10-29, BEFORE any implementation or worlds. Amends V1 ONLY as
below. Reason: (1) V1's "≤96 worlds" is arithmetically incompatible with
per-config full batteries (6 mains + 36 probes = 42/config) — same error
class as M-GATE V1c; corrected to the frozen hard caps with exact
accounting. (2) Read-only verification completed the design: gap-cancellation
proven (S-GATE gaps bit-identical across configs; transfer 0.0 even under
M-GATE asymmetry — the guard is sound with huge headroom); S1/S2/S3
instantiated to exact configs; S2 needs small harness code (no engine-core
changes), everything else is pure config.

## Grid (6 configs, 252 exec; bank `evidence/r-gap-dev/fresh-01/`, 387001–387054)

- Control (tau-style null): BT ecology defaults, marginGateTau null
  (gate never opens; NO pull code — Gen1-equivalent, bit-identical
  billing baseline for the transfer guard).
- S1a `shared`: motorRepresentation shared (16-dim, Gen1 stock space).
- S1b `appetite`: motorRepresentation appetite (48-dim).
  (Rationale: feature-space capacity ladder 16/48/96; intake/balance held
  for Phase B. Battery compatibility verified by fixture BEFORE execution.)
- S2a `frontload`: acquisition ON first 256 ticks of each 512 phase only.
- S2b `recent`: acquisition ON last 256 ticks of each 512 phase only.
  (Rationale: timing, not volume; tests whether WHEN you learn moves the
  gap. New experiment-arm branches calling the EXISTING freeze semantics on
  tick windows — zero new engine ops; billing asymmetry is the frozen-arm
  pattern, which never tripped the transfer guard (0.0 throughout M-GATE).)
- S3 `tdwarm`: motorRule td + criticWarmStart (critic machinery REQUIRES td
  per engine assert; contradicts the motor-rule status quo).
  (S3 second slot intentionally left empty: td-vs-progress is ONE question;
  warm-vs-cold within td is the second; 5 proposals + control = 6 configs.)

Per config: 6 candidate mains (anchors) + A/B/transfer current+reset probes
(6 keys × 6 histories = 36) = 42 exec. Total 252 ≤ 300 hard cap; expected
~13e9 ops ≤ 20e9; wall ≤3600s; storage ≤200MB. (≤96/gen was the error;
≤8-proposals envelope stands: 5 proposals used.)

## Instrument delta (frozen formula; harness only, null-default)

`taste-experiment.mjs`: two new arm branches (`frontload`, `recent`) applying
`freezeTasteEnergyBody`-equivalent acquisition gating on tick windows
(computed with plain-JS tick comparisons, unbilled; the skipped updates bill
nothing — the frozen-arm pattern, transfer-guard-monitored). No changes to
`learning/taste-energy.mjs` (all S1/S3 are pure configs). Default behavior
identical (new arms unreachable unless named).

## Bars (V1 G1–G5 stand, clarified)

- G1: best-proposal mean |d| − control mean |d| ≥ +0.5 (A/B pooled, per-history
  means; spent scale mean 1.265 sd 0.72 — +0.5 is 0.7σ, real not noise).
- G2: transfer guard |Δ| ≤ 0.1 per history else INVALID (mechanism proven
  above: transfer gaps cancel anchor billing exactly).
- G3 caps (above). G4 baseline sanity [0.5, 2.5]. G5: triage + fixtures for
  the scorer, per-representation battery smoke, S2 arm-boundary behavior
  (learns in-window, frozen out-window), ALL green BEFORE execution.

## Not included (unchanged)

No rescoring; no second attempt (V1d crash-resume terms); Phase B only on GO
(second generation + copy-control + matched budget); RSI claim ONLY on the
original gate. Spent numbers remain FROZEN INPUTS (calibration), never judged.
