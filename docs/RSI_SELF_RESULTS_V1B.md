# RSI-SELF results — Phase B NOGO (selection hurts: eval overfits)

Frozen: `docs/RSI_SELF_PLAN_V1B.md`. Single authorized attempt: 12 mains
(selfmod/random/fixed × 4 histories, fresh bank 397001–397036), 0 probes.
No crashes, no resume (`redone: []`).

## Verdict: PHASE-B-NOGO [selection harmful] (G3 fails, fail-closed)

- G1 integrity ✓: 12/12 mains complete; ledger exact
  (12/0/21504/516096/2.04e9); all 24 checkpoint-slots present with n>0 and
  all fields (selfmod n≈136–141 proposals/main = 24 agents × 6 cps minus
  normal deaths; fixed n=0 as designed).
- G2 auditability ✓: every selfmod decision == mechanical rule (item order,
  direction mapping, adopt-threshold, skip shape); every random record shows
  blind application with logged flip and null eval fields. Both arms ran
  exactly as frozen.
- G3 safety ✗: mean level gap selfmod−fixed = **−0.46** (tolerance ≥ −0.15).
  Fixed beats-or-ties selfmod on all 4 seeds — consistent harm, not a fluke.
- G4 liveness ✓: 8 adopt-slots + 24 keep-slots, 0 skips. Both branches live.
- G5 persistence ✓: 17 persistent adopts spanning {rate, gain} — accepts DO
  stick. Notably margin never persisted (adopted-then-reverted or never
  adopted): the selector avoided the known-null item, consistent with M-GATE.
- G6 selection label: selfmod−random = **−0.46 → "selection harmful"**.
  Random blind application (≈ fixed) does NOT harm; only the agent's
  EVALUATED selection does.

## What this decides

The loop is honest (G2) and its accepts persist (G5), but its evaluation is
ANTI-predictive: configurations that win on the 8-record held-out window
lose live. This is eval-window overfitting, not a broken loop — the
fit-32/test-8 sandbox does not generalize to the live trajectory. The
program learns exactly what it needed: **the blocker moved from "can the
agent select?" (yes) to "can the agent evaluate?" (not like this).** Any V1c
must fix evaluation first (larger windows, live rollouts, or counterfactual
replay) — new menus on the same eval would repeat this NOGO.

NO RSI CLAIM under any reading: single-agent menu selection with harmful
selection is substrate information, not self-improvement. V1a's GO stands
(mechanism demos are not invalidated by selection failing); V1a's published
gap was re-verified with a correct mean during V1b implementation (the `y+y`
typo existed ONLY in the new V1b file, caught by fixtures pre-run; V1a's
`x+y` was and is correct).

## Standing maintenance rule (new)

Bank-build fixtures are single-use by construction: they pass pre-spend and
must convert to rebuild-refusal guards post-spend (V1a test + V1b test both
converted this turn). Future lines: freeze the guard conversion as part of
the execution commit.

## Cumulative: 7447 + 12 = 7459 (all ledgered, zero duplicates)
