# GEN1-PACED PLAN V1 — Amendment A1 (FROZEN 2026-11-04)

## Triage-found regrowth leak (amount-only hiding defeated)
First triage (same-history capped vs uncapped, 256 ticks): capped
0.0356 vs uncapped 0.0368 per-agent-tick — pacing did nothing.
Cause: the engine regrows food BEFORE feeding within each step
(engine.mjs: regrowth line runs first, feeding after). Zeroed amounts
refill from regrowth in the same tick, so agents eat nearly normally —
amount-hiding alone leaks ~97%.
Fix (no engine change): hidden ticks now ALSO pin
`world.config.nutrient` to 0 (validated range [0,5]; used ONLY in the
regrowth formula — safe). No regrowth accrues while hidden; cues/
contacts/behavior intact. Restore post-step adds hidden amounts back
and restores nutrient — with a phase-transition guard (if a phase
boundary fired mid-step and set its own nutrient, the phase value is
kept, never clobbered). Amounts are transition-safe (enterCuePhase
and updateCueResources preserve amounts; energy-conservation asserts
hold end-to-end since hide/restore bracket the tick).
Expected capped rate now ~2/3 of uncapped (verified by re-triage
before bank mint; manipulation gate unchanged: capped ≤ uncapped×0.8
else INVALID).
