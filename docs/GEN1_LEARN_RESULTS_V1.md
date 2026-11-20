# GEN1-LEARN V1 verdict (2026-11-04) — NOGO (learning degrades intake)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_LEARN_PLAN_V1.md`. New
instrument (placeLearned: identical placement minus ONLY the freeze;
acquisition stays on — taste+actor+critic update by experience; no
copying/mutation/offspring/tuning). Fixtures 7/7 green pre-run (zero
worlds; two laziness repairs — function-body split, pooled-count
expectation — zero mechanism impact); triage on throwaway 490127–
490135 (digest MOVES in 256 ticks + exact balance + completion)
BEFORE bank mint. Bank 474433–474450 minted post-triage, verified
clean. Single attempt, as measured. No rescoring.

## Results (pairs 474433, 474442; naive init, 48 energy; repro off)
Manipulation PASSES both directions: learned digest moved (both
histories — treatment engaged), naive digest fixed (both — control
clean). Survival: learned 0.667 (32/48: 0.708+0.625) vs naive 0.792
(38/48: 0.875+0.708) vs deep 0.958. Bar (learned > naive×1.1 = 0.871):
0.667 < → **NOGO** (`GEN1-LEARN-NOGO-V1`). Learning HURTS
(+6 deaths vs frozen). Splits: learned losers all UNDER (16/16);
naive 9/10 UNDER + 1 NEVER — same failure mode (insufficiency),
just more of it. All deaths energy.

## Reading (adaptation mis-tunes foraging)
Per-tick rates (474433): learned intake 0.0284 vs naive 0.0315
(costs flat 0.0416 vs 0.0422). Learning degrades INTAKE, not costs —
the adapting controller finds/eats less (experience mis-tunes the
policy for the depleting world it helped create) while spending the
same. Consistent with the program's frozen-learning themes (V2 harm:
continued learning loses to freezing; retention voids) — now with
the mechanism (intake, not cost) and both-direction manipulation
proof. In-world adaptation is not the rescue; the static init policy
forages better here.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-learn-dev/fresh-25/` (bank, now spent) +
`evidence/gen1-learn-dev/attempt-01/` (untracked raw evidence, ~1M;
digests, per-agent intake+cost, splits, causes, exact ledgers).
