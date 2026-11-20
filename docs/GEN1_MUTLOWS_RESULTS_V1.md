# GEN1_MUTLOWS V1 verdict (2026-11-04) — NOGO (both pairs miss by dust: +0.093/+0.092 vs +0.10; the mirror of MUTHOME V1)

## Authorization
Program-level user authorization under standing discipline; frozen
plan `docs/GEN1_MUTLOWS_PLAN_V1.md` (MUTLOW bar at SHORTCOL horizon:
mut01−naive survival > +0.10 AND intake > +0.002, both pairs).
Fixtures 7/7 green pre-run (zero worlds) + 1 new helper fixture
post-fix (see repairs). Triage full pipeline on throwaway 490505–
490513 (digests move + births 15/15/15 + all 900-tick colonies
complete) BEFORE bank mint. Bank 475189–475206 minted post-triage,
verified clean (`475189`, `475198` heads). Single attempt (12 runs),
fix-forward resume after a helper crash (disclosed below) reusing
3 complete rows. No rescoring. Fourth factorial cell — not a re-run
of any closed line.

## Repairs (disclosed, fix-forward pattern)
Mid-attempt crash on pair 1 copy colony: `survivalFraction` asserted
alive ≤ founders, but low-mortality 900-tick colonies hold more flies
than founders (founders + live newborns) — a helper contract bug the
1792-tick banks never tripped (their mortality kept alive ≤
founders). Fix: count FOUNDERS alive (newborn-aware). Added 8th
fixture (pure, zero worlds) green; full 7/7 stands pre-mint (the
tmp-mint case cannot re-run post-mint by design — bank file exists).
Resumed with `resume:true`; 3 rows reused, 9 run fresh, dual
provenance in ledger `redone`. Scored metric (offspringSurvival from
the agents table) untouched by the fix.

## Results (pairs 475189, 475198; per-pair, both required, frozen rule)
A/B-content PASSES both; skill genuine. Colonies birth 26+27+28
pooled. All 12 runs complete. No floor (copy pooled 0.846).
- Offspring survival pooled: copy 0.846 vs mut01 0.739 vs naive 0.646.
- Mut01−naive gaps: +0.093 / +0.092 — BOTH miss +0.10 by ~0.007 →
  **NOGO** (`GEN1-MUTLOWS-NOGO-V1`). Intake gaps +0.0082 / +0.0081
  clear by margin.
- Copy−mut01 pooled +0.107 descriptive.
- The bar holds at 0.007: the exact mirror of MUTHOME V1 (GO by
  dust), decided the same way — frozen bar, no rescoring.

## Reading
The factorial is complete: 0.05×1792 (+0.018/+0.006), 0.01×1792
(+0.186/+0.065), 0.05×900 descriptive (4/6), 0.01×900 (+0.093/+0.092)
— no cell clears both pairs; the closest miss is this one. Dose and
horizon do not interact into a GO: 0.01 halves the pooled deficit vs
0.05 at 1792 (+0.126 vs +0.012) and the window lifts both doses, but
pair-stability never arrives. The dose question is closed at both
doses × both horizons: mutated transmission keeps the intake edge
everywhere (now 10/10 bank-pairs counting both window pairs here)
and never converts it into a per-pair-stable fate edge. The program's
population verdict is final within this substrate: intake transmits,
fate does not — reliably. Line closed as scored.

## Preservation
`evidence/gen1-mutlows-dev/fresh-66/` (bank, now spent) +
`evidence/gen1-mutlows-dev/attempt-01/` (untracked raw evidence,
~1.3M, 12 rows with tn=0.01 + 900-tick provenance + resume ledger).
