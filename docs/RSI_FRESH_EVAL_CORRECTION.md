# CORRECTION: fresh-eval gate-(1) misread — no exact-zeros ever occurred

## Root cause (methods bug in MY parsing, not the runner)

`results.json` stores `sequence` = per-history (candidate − unlearned)
DIFFS and duplicates the same array as `controlComparisons.unlearned`.
From the Gen7 turn onward I printed both fields and read
`sequence.mean − cc.unlearned.mean = 0.0` as "candidate == unlearned",
when `sequence.mean` itself IS the gate-(1) effect. Every "EXACT ZERO
(identical 8/8)" report from Gen7–Gen14 was this subtraction artifact.
The runner, banks, attempts, and worlds are all valid; only my
gate-(1) readings and every conclusion built on them were wrong.

## Corrected verdicts (single parser implementing V2 gates verbatim,
validated by reproducing the Gen6 ACCEPT)

| eval | revision | g1 seq | g2 frz | g3 rst | g4 skl | g5 ret | g6 trn | verdict (old → new) |
|---|---|---|---|---|---|---|---|---|
| gen6 | R=4 | +5.41 8/8 ✓ | +3.07 ✓ | +0.15 ✓ | ✓ | ✓ | ✓ | ACCEPT → ACCEPT |
| gen7 | g=2 | +5.94 8/8 ✓ | +4.44 ✓ | +0.99 ✓ | ✓ | bR −0.05 ✗ | ✓ | REJECT → REJECT (gate 5, not 1) |
| gen8 | slots | +2.74 8/8 ✓ | +2.23 ✓ | +0.94 ✓ | bAcq 4/8 ✗ | ✓ | ✓ | REJECT → REJECT (gate 4, not 1+5) |
| gen9 | (48,8) | +5.36 8/8 ✓ | +4.26 ✓ | +1.58 ✓ | ✓ | bR −0.27 ✗ | ✓ | REJECT → REJECT (gate 5, not 1+5) |
| gen10 | (40,10) | +4.78 8/8 ✓ | +3.65 ✓ | +0.90 ✓ | ✓ | aR +0.30 6/8 ✓ bR +0.10 4/8 ✓ | ✓ | REJECT → **ACCEPT** |
| gen11 | S=3 | +5.27 8/8 ✓ | +3.75 ✓ | +0.91 ✓ | ✓ | aR −0.05 ✗ bR −0.06 ✗ | ✓ | REJECT → REJECT (gate 5, not 1+5) |
| gen12 | μ=0.5 | +4.15 8/8 ✓ | +2.94 ✓ | −0.14 ✓(boundary) | ✓ | ✓ | ✓ | REJECT → **ACCEPT** |
| gen13 | tr=0.3 | +4.27 8/8 ✓ | +2.89 ✓ | +0.20 ✓ | ✓ | ✓(B psv −2 boundary) | ✓ | REJECT → **ACCEPT** |
| gen14 | match R=8 | +3.71 8/8 ✓ | +2.47 ✓ | +0.58 ✓ | ✓ | A psv −3 ✗ | ✓ | REJECT → REJECT (gate 5, not 1) |

## What survives, what falls

* FALLS: universal silencing, Goldilocks singularity, "seven consecutive
  exact-zeros", threshold-collapse as the revision killer, family-closure
  stakes of V17, the negative synthesis built on them.
* STANDS: all search results and scores (parsed from the correct fields);
  all spent banks; all world counts; base robustness (R=4-alone positive
  8/8 fresh banks: +5.41, +4.43, +5.19, +4.49, +5.13, +5.00, +5.15, +5.52);
  every gate-4/5/6 reading (separate fields, correctly parsed).
* NEW TRUE PHENOMENON (attenuation, not silencing): revisions hold
  lifetime superiority (+2.7 to +5.9) but trail the same-bank base
  (+4.4 to +5.5); the recurring killer is RETENTION/SKILL detail
  (g4/g5 fail 5 of 8 evals), never lifetime.
* Successive counter corrected: Gen6 ✓, Gen10 ✓, Gen12 ✓, Gen13 ✓ are
  four FIRST-accepts in three lines (main: Gen6, Gen10, Gen12; retention:
  Gen13) — no two consecutive in any single revision line yet. No RSI
  claim (correct conclusion, wrong reasons before).
* Gen14 (matching×R=8) fails honestly on A-probe survival (−3): the
  threshold bypass keeps lifetime alive but bleeds retention survival —
  matching line closed as a lead, open as a component.

Round worlds V19: 80 search + 48 eval + 24 control = 152. Cumulative 3400.
