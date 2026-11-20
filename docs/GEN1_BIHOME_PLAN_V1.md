# GEN1_BIHOME PLAN V1 (frozen 2026-11-04) — biparental through gauntlet + return

## Why this line, and only this one
MUTHOME/MUTHOME2 dissolved the mutated edge through gauntlet+return
(pooled frac 0.72 GO-by-dust → 0.35 NOGO; naive catch-up). Biparental
recombination is the stable channel (GO,GO,NOGO-at-extinction, 5/6
survival pairs) — never put through immersion. The licensed question:
does the recombined edge survive gauntlet + return-practice where the
mutated edge did not? Same MUTHOME pipeline with a bi arm (mixed
founders, biparental birth) replacing mut: colonies → birth-weight
extraction → frozen pre-probes → BCR-train 1280 (learn on) → frozen
post probes. Not a re-run of MUTHOME (maternal/mut arms) or BIPAR
(no tasks).

## Pipeline (15 runs/history, 2 histories, 30 total; all runs scored, no selection)
Identical to MUTHOME V1/V2 except the scored arm: trainAB (512+512,
digest gates else INVALID), skill pair 256 (skillT > skillN else
INCOMPLETE-NOSKILL), three colonies/history 1792 (A1 mating,
reproduction ON, frozen newborns): copy (uniform trained, maternal)
vs bi (mixed founders trained-mothers/init-fathers, biparental) vs
naivekid (uniform naive, vt none) — WAIT: MUTHOME colonies were
maternal-exact/init; here copy = uniform trained maternal, bi =
mixed + biparental, naivekid = uniform naive vt none. Extract birth
weights per colony; matched-N groups; frozen birth pre-probes 256;
BCR-train 1280 (learn ON, engine B-entry, auto B→C→return-A); frozen
post A-probes 256 original cues. Scored: bi gap after return +
bi retention fraction vs birth.

## Verdict (pooled, n=2, frozen — MUTHOME bar)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 6 → INCOMPLETE-LOWBIRTHS.
- bi pre-gap ≤ 0 → INCOMPLETE-NOGAP.
- GO (`GEN1-BIHOME-GO-V1`) iff bi post-gap > +0.002 AND biPost > 0
  AND bi fraction > 0.5 (recombined edge survives gauntlet + return);
  else NOGO. Copy gap/fraction descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-76` main 475369–475386 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490595–490603 (9).
  Never regenerate spent banks.
- Fixtures `tests/gen1-bihome-dev.test.mjs` 7/7 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (digests move
  + mixed placement verified + births ≥ 1/arm + full BCR + pre/post
  probes complete).
- BT caps; ~1-2M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no colony immersion before tasks;
  matched-N; original cues; mixed-sex founders for bi only.
