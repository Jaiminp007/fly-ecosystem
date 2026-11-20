# VALUE-PROBE Plan V1 — critic-vs-actor localization (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan +
frozen-plan discipline; the single authorized attempt runs only on the
implemented instrument.

## Objective

Decide whether the transfer floor is LEARNER-side (per-cue values wrong)
or ACTOR-side (values right, turn behavior doesn't follow), localizing
the BH binding constraint (mean correctness 0.20 despite prior-scaled
value learning, partial +0.54) and the HB floor (mixed, partial −0.17).
Prior art: Miller & Matzel comparator (1988), Green & Swets SDT (1966),
Quirk vmPFC dissociation (2000); program evidence: QD map §3, prior-
strength dissociation §3 (all specified, none executed until now).

## Instrument changes (SPECIFIED here, IMPLEMENTED next turn)

1. Engine export `probeCueValues(state, cues)` (taste-energy.mjs,
   null-default, behavior-identical when uncalled): for each 4-bit cue
   pattern builds taste phi through the EXISTING tasteFeatures path and
   returns tastePrediction under current weights. Taste phi is context-
   free (cue only), so end-of-seg probes are EXACT — no reconstruction
   risk, no live logging needed. All probe ops billed through m.
2. Instrument `scripts/value-probe-dev.mjs`: V1 reference triple
   (train + uniform-transferred + unlearned) × 3 pairs = 9 mains;
   snapshots weights at train-end + seg1-end (reuse snapshotWeights/
   copyWeights); 12 cue probes per snapshot (train codebook at train-
   end, test codebook at seg1-end); per-cue per-third turn/contact
   counters tapped at the existing cue-summary aggregation point
   (located at implement time); rows store per-cue (probe value, turn
   rate total + late-third, contacts, test valence).
3. Scorer: per-cue value-correctness (probe on correct side of 0.5 vs
   test valence) vs behavior-correctness (turn matches test valence);
   SDT d′/c per pair for values and behavior (round-23 prescription);
   BH gap primary, HB gap descriptive.

## Arms, bank, caps

- Arms (3): train (reference + validity anchor), uniform-transferred
  (test), unlearned (baseline d′≈0). 9 mains, no gain arm (localization,
  not intervention — minimal).
- Bank `evidence/value-probe-dev/fresh-01/`: 6 histories 421001–421054,
  drawn {001,010,019,028,037,046} (turn-gate convention). 421xxx
  verified pristine 2026-10-26 (zero exact-seed hits, zero registry
  hits, zero test/script tokens; 420032 token exists but is outside the
  drawn set — 421 chosen to leave zero ambiguity). Builder re-verifies
  drawn-seed zero-collision at build; post-build refusal guard.
- Caps (mirror turn-gate V1b + probe budget): 9 mains; probes are
  billed ops inside mains (36 probes/main × ~16 mults ≈ negligible,
  probe cap 500/main, probe ops included in ledger); exec caps 9 mains
  / 16128 worldTicks / 387072 founderSlots / 1.5e9 scalarOps.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity: 9/9 complete, ledger exact, `redone: []`.
- G-validity (fail → INVALID, no verdict): train-end probes must show
  value-correctness ≥ 0.75 (train behavior gap is 0.81; the readout must
  reproduce known knowledge) AND unlearned |d′_value| ≤ 0.3. If probes
  can't read out train knowledge, the instrument is broken.
- G-gap on BH cues (late-third behavior vs end-values, time-matched):
  value-correctness ≥ 0.6 AND (value − behavior) > +0.2 →
  **ACTOR-SIDE** (→ threshold-plasticity freeze licensed, not executed).
  value-correctness ≤ 0.5 → **LEARNER-SIDE** (→ negative-update freeze
  licensed, not executed). Else **INDETERMINATE** (line closes, no
  license). Fallback (per-third tap infeasible at implement time):
  aggregate behavior with bar raised to +0.3, pre-registered here.
- HB gap reported descriptively (mixed prediction, no gate).
- INCOMPLETE if mains don't finish (halt, no verdict).

The line closes with its verdict either way. Follow-ups need their own
frozen plans (a verdict licenses freezing, never executing). No V2
without a new rationale. Single authorized attempt, cumulative +9.
No RSI claim.
