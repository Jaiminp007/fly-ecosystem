# ODOR DEV ROUND 2 RESULTS V1 — NO-GO (rehearsal fixes A, breaks transfer)

Executed 2026-11-02 on the same 8 reused histories (hash-verified bank
copy, `bankSha256` match). One acquisition arm (learned-interleaved,
A256-B512-A128-C512-A128-D256) + full probe suite. 26.98e9 scalar ops
(cap 40e9 ✓), wall within 3600s ✓. One pre-completion crash-rerun:
phaseDurations fix (committed), debris cleared (1 partial history,
zero rows written), single complete execution. Dev only, not qual.

## Verdict: R2-NO-GO (transfer gate fails)

| gate | round 2 | round 1 | bar | met |
|---|---|---|---|---|
| transfer vs reset | −1.20 mean, 1/8 positive, surv −1 | +0.42, 5/8 | mean>0, 6/8, surv≥0 | NO |
| transfer vs cheap native-full | −1.31, 1/8, surv −1 | +0.36, 5/8 | same | NO |
| A-retention | 96.03% | 22.48% | ≥95% | YES |
| B-retention (guardrail) | 72.88% | 179.07% | ≥95% | NO |
| vs guarded (descriptive) | +0.14, 5/8 | −0.55, 0/8 | — | — |
| vs native (descriptive) | +0.02, 4/8 | — | — | — |

## Reading (descriptive, dev-only)

1. **The rehearsal mechanism is confirmed on retention and killed
   on transfer — in the same run.** A 22%→96% is the predicted
   effect (re-exposure preserves the early skill); B 179%→73% is
   the predicted cost (fixed budget redistributed). The hypothesis
   behaved exactly as theorized — and transfer still collapsed
   (+0.42→−1.20). A-retention does NOT imply transfer: the D-state
   steering that transfer probes is worse after rehearsal, not
   better. Retention and transfer dissociate (second dissociation
   on record this month: intake-vs-correctness in C17).
2. **Guarded gap narrows but persists** (−0.55→+0.14, 0/8→5/8).
   Interleaving closes two-thirds of the hand-designed gap; the
   remainder is still policy, not exposure — consistent with the
   guard-feature diagnosis (viability input missing).
3. **Survivors stay thin** (2–9/history). Rehearsal preserves skill
   in the living, not lives in the dying — mortality is a separate
   mechanism (see MORTALITY_MEASUREMENT_V1), untouched by this round.

## Consequences (frozen mapping)

- NO-GO: rehearsal hypothesis closed AS A TRANSFER FIX. Round 3 =
  guard-feature augmentation (recorded candidate, needs its own
  scoping→freeze; NOT authorized by this doc).
- No qual consideration (transfer failed — bank protection held for
  the right reason).
- DTR part (iv) still waits on a second qualified task; the odor
  lane remains exploratory. The A-96% shows retention CAN move on
  reused histories — bank that for the eventual qual design.

## Cumulative dev spend

Round 2: 26.98e9 ops. Round 1: 35.66e9 ops (archived actuals).
