# GRANDMOTHER CHECK V1: survivors ride births — neither help nor competition at arm level

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R126-specified grandmother-vs-lingering analytic on 396 rows.
Script: `scripts/grandmother-check.py`.

## Question

Do runs with many mouths left standing convert better (grandmother-like
help) or worse (lingering competition)? Founder-specific survival is NOT
logged (survivors = founders + newborns; deaths unsplit) — this is the
arm-level decidable portion; the individual level stays blocked on the
specified per-founder table gap.

## Findings

1. **Uncontrolled correlation is confounded.** Spearman(survivors, gen-2)
   = +0.32 — but Spearman(survivors, births) = +0.52. High-survivor rows
   convert more (63/107 vs 18/104) AND give birth more (7 vs 3). The
   association rides the numbers game (PERSISTER_CHECK).
2. **Controlled: nothing left.** Restricting to births 4–8 (n=259),
   Spearman(survivors, gen-2) = +0.10 — survivors carry essentially no
   information about conversion beyond birth count.
3. **Neither pattern.** No grandmother enrichment (old mouths don't
   predict success) and no competition depletion (they don't predict
   failure either) — survivors are a PASSENGER of births: more births →
   more mouths standing and more gen-2 chances, independently.

## Verdict (measurement — no GO/NOGO)

- **DISSOLVED at arm level:** the grandmother-vs-lingering question has
  no arm-level answer because there is no arm-level phenomenon — survivor
  count is epiphenomenal on birth count. Fourth line for the event-count
  binding constraint (encounter bottleneck, floor skew, numbers-game
  conversion, now passenger survivors).
- **STILL BLOCKED (individual level):** whether OLD (founder) survivors
  specifically help or hinder needs founder-vs-newborn death splitting —
  the same compact per-founder table gap (birth tick, death tick, cause,
  offspring, role). One schema addition, no behavior change.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
