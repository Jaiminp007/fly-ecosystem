# RSI-SELF results — Phase D NOGO (signal does not replicate; line closed)

Frozen: `docs/RSI_SELF_PLAN_V1D.md`. Single authorized attempt: 32 mains
(4 arms × 8 histories, fresh bank 400001–400072), 0 probes. No crashes,
no resume (`redone: []`).

## Verdict: PHASE-D-NOGO (G6a fails; everything else passes)

- G1 integrity ✓: 32/32 mains complete; ledger exact
  (32/0/57344/1376256/5.46e9); all 48 selfmod slots present, all fields.
- G2 auditability ✓: selfmod + random + CROSS-ARM copied all rule-match.
  The mirror audit held live: 47 selfmod adopts at tick 1024 → exactly 47
  copied applications at 1280; 1 adopt at 1280 → 1 application at 1536.
- G3 safety ✓: gap selfmod−fixed = **+0.07** (harmless).
- G4 liveness ✓: 9 adopt-slots + 48 keep-slots, 0 skipped.
- G5 persistence ✓: **48 persistent adopts** spanning {rate, gain}.
- G6a replication ✗: selfmod−random = **−0.04** (bar > +0.1). V1c's +0.21
  on 4 histories did not replicate on 8. Pooled 12-history selGap ≈ +0.04 —
  the signal was noise, as the pre-registered rule now records.
- G6b copied table: selfmod−copied +0.07, copied−fixed **0.00** ("configs
  are all that matters" — and even the configs hardly matter, see below).

## What this decides (line-closing negative)

1. **Replication kills the signal.** V1c +0.21 (n=4) → V1d −0.04 (n=8);
   pooled +0.04. The faithful-eval selection edge is not real.
2. **Timescale autopsy.** Selfmod adopts herd at the B→C boundary (47/48 at
   tick 1024, rate 1→2); copied applies them faithfully at 1280 — yet
   copied == fixed BIT-IDENTICAL on all 8 histories. Doubling the learning
   rate for the final 512 ticks changes nothing measurable. The loop stays
   quiet early (keeps at 256/512/768) and acts when it no longer matters;
   combined with V1a–V1c (≈0 level effects throughout), rates/menus don't
   move level at ANY time here — saturation, not insensitivity (the same
   metric caught V1b's −0.46 harm).
3. **All four arms tie** (selfmod −58.91, random −58.87, fixed −58.98,
   copied −58.98): evaluated selection, blind chance, static base, and
   lagged copying are indistinguishable. Selection among equals.

## Program consequence

The in-run menu-selection line is CLOSED by its own pre-registered rule:
mechanism proven (V1a GO), eval fixed (V1c GO), effect absent on replication
(V1d NOGO). This mirrors the external-search era (29 classes exhausted):
the BT substrate is saturated for learning-knob interventions, whether the
knobs are turned from outside or inside. V1e (successive revision across
runs) is NOT licensed — carrying noise-selected configs across runs cannot
compound what isn't there. Reopening requires a substrate with headroom
(mating ecology remains the named candidate; still blocked on zero births)
or a different intervention class, under a fresh plan.

NO RSI CLAIM under any reading. All four RSI-SELF phases stand as published:
V1a mechanism-GO, V1b overfitting-NOGO, V1c faithful-eval-GO, V1d
replication-NOGO. The arc is complete and self-consistent.

## Standing rule applied

V1d bank fixture converts to rebuild-refusal guard post-spend (fourth
instance). Triage: 6 pristine failures only.

## Cumulative: 7459 + 32 = 7491 (all ledgered, zero duplicates)
