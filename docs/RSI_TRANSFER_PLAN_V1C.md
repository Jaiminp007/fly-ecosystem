# RSI-TRANSFER PLAN V1C — FROZEN (self-proposed freeze + energy transfer)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (different change, not a re-run)
V1/V1b tested loop-proposed RATE changes under transfer (energy and
births): both lose to unlearned — train-phase learning overfits, init +
fresh learning wins. This line changes WHAT the loop can propose: a
FREEZE (lock weights when learning saturates), not a rate. Freezing is
not a menu variation (no OL item freezes; V1b menu was rate/gain/margin;
schedules are a C-series matter — this is SELF-line endogenous timing,
per-agent, evidence-triggered). Rationale, calibrated on V1's own
proposal archive (read-only): keeps are common (99/134) and rising
incumbent sandbox error on consecutive keeps marks saturation; freezing
there preserves A-stage-ish weights without B/C overfit — the one
weight state plausibly transferable (taste-backward: B/C learning
protects rather than destroys, but full-run weights still lose to init).
If self-frozen weights transfer above unlearned, a self-proposed change
beats the never-learner for the first time; if not, the overfit runs
deeper than B/C and the product gap stands on three evals.

## Design (frozen; V1a loop wrapped, not rewritten)
- Instrument: `scripts/rsi-transfer-v1c.mjs` (new; V1 train/probe/scorer
  pattern copied, loop wrapped). 2 pairs × (3 trains + 3 energy probes)
  = 12 mains, ZERO other probes, no reproduction, BT ticks/caps.
- Loop (imported `selfPropose` UNTOUCHED; wrapper decides freeze):
  per founder, at checkpoints, run V1a logic; if decision==keep AND a
  previous keep baseline exists AND errInc >= baseline → FREEZE
  (`freezeTasteEnergyBody`, record decision:'freeze'); set baseline on
  every keep; clear baseline on adopt; skips touch nothing. First keep
  only sets baseline (never freezes — no mass-freeze at 512).
- Arms: selfmod (freeze-capable loop) / fixed (learns, never proposes) /
  unlearned (never learns). Probe: V1-identical transplant at per-agent
  final rate (adopt→propRate, keep/freeze→incRate-at-decision, median),
  full advance, endpoint energy. Expected freeze events ≈5–11 (V1
  archive: 20 keep+rise non-first); rate adopts continue as in V1.
- Bank: `evidence/rsi-transfer-dev/fresh-03/` 473154–473189 (4 × 9 =
  2 pairs), verified clean pre-freeze (0 exact hits evidence + tracked),
  builder re-gates at mint. First use is the single V1c run.
- Fixtures (extend `tests/rsi-transfer-dev.test.mjs`, green required):
  V1b bank → post-spend refusal guard (standing order); freeze-branch
  unit (keep+rise→freeze, keep+fall→keep, first-keep→keep, adopt→clears,
  skip→untouched); finalRate with freeze recs; scorer GO/NOGO/VOID
  branches; transplant digest round-trip (V1-covered, one parity case).
  Triage-analogue = zero-tick (no worlds pre-run).
- Caps: V1 values; expected output <8M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1/V1b stand; train gaps descriptive).

## Gates (frozen)
- G1: ledger exact (12 mains / 0 probes) + train rows complete-or-clean-
  extinct (`trainRowComplete`, V1b precedent) + transplant digests match
  + config audit (probeRate == logged final/default).
- Verdict on transfer means (n=2 pairs): zero loop events (adopt+freeze)
  → INCOMPLETE-NOFIRE (void); zero freezes → INCOMPLETE-NOFREEZE (void —
  without a freeze the contrast collapses to V1, which must not repeat);
  else mean(selfmod_te) > mean(fixed_te) AND > mean(unlearned_te) → GO
  (self-proposed freeze transfers above never-learned; thin n=2,
  licenses replication ONLY); else NOGO with stop-rule analogue.
- Scope: NO successive-revision/RSI/retention/population claim.
  Descriptive only: freeze count/timing, per-agent rates, per-pair table,
  adopted-rate spread, train gaps.
