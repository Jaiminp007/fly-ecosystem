# ODOR DEV ROUND 7 RESULTS V1 — R7-INCOMPLETE-EXTINCT (attempt consumed, no re-run)

Date: 2026-11-02. Single authorized execution per PLAN V1 FROZEN.
Triage: bank copy hash `893c60a9…cd4487` == R1 bankSha256; 8/8
short-self R1 rows hash-identical to tar bytes; seeds match.
Outcome: colony extinction, NOT a transfer verdict.

## What happened (verified, deterministic)

- Acquisition ran 1911/3584 ticks (53%), then the last fly died
  (phase B). Anchor A written (tick-1024 end); B/C/D never
  completed (world tick froze with the colony — no flies, no tick
  advance; `advance()` kept returning true through empty ticks).
- The runner's anchors-integrity assert then fired
  (`anchors.A && anchors.D` → undefined), aborting before probes.
  No rows, no verdict.json from the script. Partial evidence
  preserved as-is: protocol.json, sources/, 1 partial trace
  (99,102 events, last tick 1911), anchors/A.json, bank copy,
  short-self rows.
- Determinism verified in-memory (2 identical reps, digest-identical):
  same history, same config → same extinction at 1911. A re-run
  would reproduce it exactly: pointless and a re-spend. NO RE-RUN.

## Diagnosis (disclosed scratch runs, zero evidence writes, zero bank draws)

Three /tmp harnesses (removed after use): crash-stack capture,
determinism double-rep, fly-count timeline (24@500 → 24@1000 →
7@1500 → 1@1900 → 0@1911, phase frozen at 1). No Math.random /
Date.now in model code; divergence was never on the table — the
trajectory is fixed, extinction included.

## Verdict: R7-INCOMPLETE-EXTINCT

Not NO-GO (transfer never tested — no D anchor, probes correctly
skipped by the `if(anchors.D)` guard) and not branch-1 of the
falsifier (no lift / no plateau unmeasured, not measured-absent).
The calendar proviso is UNRESOLVED, not voided and not survived:
the slow phase remains unreached because the colony cannot get
there under R1 conditions extended — itself a persistence fact
(VISION-2: the system does not persist 2×; R1 1792-tick runs ended
with 1–5 survivors, already at the edge).
What would resolve it: a line that survives to slow-phase ticks
(different head, gentler regime, or slower burn) — a new case,
not a re-run.

## Specified repair (for future long-run scripts, NOT applied here)

1. Empty-world early exit (stop acquisition when flies hit 0;
   do not spin empty ticks).
2. Extinction verdict branch (INCOMPLETE-EXTINCT with ticks
   survived + last anchor, instead of an integrity assert that
   mislabels outcome as bug).
Nothing to apply these to — no re-run authorized, none needed.
