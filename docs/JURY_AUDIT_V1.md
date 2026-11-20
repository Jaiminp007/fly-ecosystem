# JURY AUDIT V1: histories vote independently — but unanimous zeros are one observation, not N votes

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R113-specified Condorcet jury audit on 396 frozen rows (68 bank×arm groups).
Script: `scripts/jury-audit.py`. Vote = per-history binary conversion (gen2≥1);
uniform standard for comparability — NOT each verdict's pre-registered bar (see §4).

## Findings

1. **Independence holds (median κ +0.11).** Jurors (histories) vote near-coin:
   17 majorities, 13 exact ties (maximum variance — full independence), 26
   split minorities. Condorcet's independence condition is satisfied; the
   program's N-history verdict form is legitimate where jurors vary.
2. **11/68 groups are FLOORs (N_eff = 1.00).** Unanimous zeros — mate-act
   (both arms), mate-dense (both), mate-energy (both), mate-food control,
   mate-inherit-v1 (both), mate-social copyalways — are ONE floor observed
   N times, not N independent votes for the null. Symmetric: the single
   CEILING (attract-05 hub 6/6) is also N_eff = 1 (one ceiling × 6).
3. **Verdict mapping (weight annotation, NO rescore):**
   - DISPERSE NOGO: jury-STRONGEST (hub 5/6 vs hubDisperse 1/6 — five
     independent converters vs one). Verdict confirmed at vote level.
   - RECOMBINE NOGO: jury-confirmed neutrality (3/6, 4/6, 3/6 —
     maximum-variance agreement that nothing differs).
   - LEAVE V2 NOGO: conversion juries PASS in L1/L4 (5/6 each) — the NOGO
     was the ladder shape, exactly the published logic. Vote and count
     evidence disentangled correctly in the original verdict.
   - LEAVE V1 GO / ENCOUNTER V1 GO / SOCIAL V2 NOGO: rest on COUNT margins
     among similarly-converting juries (4/6-vs-4/6, 3/6-vs-3/6,
     TIE-vs-SPLIT) — the jury audit neither confirms nor denies these
     (different bars); it bounds what vote evidence alone says.
   - MATE-ENERGY GO / MATE-INHERIT V1 NOGO: gen-1 verdicts — the uniform
     gen-2 jury standard does not apply (both FLOOR at gen-2). Flagged,
     not judged; a gen-1 jury standard would need its own audit.
   - MATE-FOOD GO: single-juror evidence (enriched 1/6) — verdict stands
     (bar met), weight thinnest in the arc. Recorded.
4. **Scope honesty.** The uniform vote (gen2≥1) is a comparability
   standard, not a re-verdict: no published bar is rescored, no verdict
   reversed. Floors stay floors (bars unmet); the audit changes their
   WEIGHT (N_eff≈1), not their outcome.

## Verdict (methodological — no GO/NOGO)

- **LICENSED:** N-history majorities where jurors vary (κ≈0, ties,
  split minorities) as Condorcet juries; DISPERSE/RECOMBINE/LEAVE-V2
  jury readings as published.
- **DISCOUNTED (not reversed):** floor-resting verdicts carry N_eff≈1 —
  cite as "floor on N histories (single observation)", never "N
  independent nulls". Same for the lone ceiling.
- **PRESCRIPTION (method import, next frozen line):** pre-register vote
  tallies (per-history binary conversion) ALONGSIDE count bars, and
  pre-register which decides. Vote/count disentanglement (done ad hoc
  in LEAVE V2) becomes standard form.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
