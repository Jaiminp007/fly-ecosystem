# RSI-SELF plan V1a — checkpoint-tick correction (FROZEN)

Status: FROZEN 2026-10-30. Amends V1 (which stands preserved, never edited).
Single authorized Phase-A attempt only. No code, no bank, no worlds yet under
this line. Further changes require V1b+.

## The correction

V1 specified checkpoints "at ticks {448, 896, 1344} (BT phase boundaries)".
The tick values are factually wrong. Ground truth (`continual-regimes.mjs`):

- `CONTINUAL_PHASES = [A:512, B:512, C:512, return-A:256]` (total 1792 ✓)
- `TasteExperiment` starts `phaseEnd=512`, transitions fire when
  `world.tick===phaseEnd`, then `phaseEnd+=phase.ticks`.

True BT phase boundaries (world.tick): **512 (A→B), 1024 (B→C),
1536 (C→return-A)**. The values 448/896/1344 (=1792/4) were an arithmetic
error: phases are 512/512/512/256, not 4×448.

## Amended contract

Checkpoints are **{512, 1024, 1536}**, defined as "BT phase boundaries
(A→B, B→C, C→return-A)". Runner triggers check-then-step: when
`run.world.tick` equals a checkpoint (before stepping that tick), invoke
`selfPropose` on agents with `config.selfMod===true`, then `run.step()`.
The parenthetical intent in V1 ("context just changed — good time to
reconsider hyperparameters") is now actually satisfied: all three
checkpoints sit exactly on context transitions.

Everything else in V1 stands UNCHANGED: proposal rule, eval protocol,
billing fee, arms (incl. shared surpriseGain:0.5/surpriseWindow:16), bank
(396001–396036, 8 mains / 28 reserved), caps, G1–G5 bars (12 proposal
records = 3 checkpoints × 4 selfmod mains), single attempt, no improvement
claimable, GO licenses proposing (never executing) a V1b.

## Implementation note (in scope, precedented)

V1's contract keys the hook on `config.selfMod`. That key does not exist in
the engine allowlist (`taste-energy.mjs:25`), which throws on unknown keys.
Implementation therefore adds `selfMod` (default `false`) to the allowlist,
defaults, and restore-preservation — the exact M-GATE `marginGateTau`
precedent: null-default, behavior-identical when off (the engine never
self-triggers; only the runner invokes the loop). This is instrument
plumbing required by the frozen contract, not a mechanism change.
