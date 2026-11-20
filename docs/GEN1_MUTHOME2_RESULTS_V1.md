# GEN1-MUTHOME2 V1 verdict (2026-11-04) — NOGO (mut fraction 0.35; one pair carries, one fully erodes)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~27-29G before
and after; output ~1.4M). Frozen replication plan
`docs/GEN1_MUTHOME2_PLAN_V1.md` (verbatim MUTHOME instrument,
GMH2_ clone; bar UNMOVED: GO iff mut post-gap > +0.002 and mutPost
> 0 and mutFrac > 0.5). Fixtures 7/7 green pre-run (zero worlds);
triage full pipeline on throwaway 490415–490423 (digests move + 15
births + BCR full 1280 + pre +0.0100 → post +0.0101) BEFORE bank
mint. Bank 475009–475026 minted post-triage, verified clean
(`475009`, `475018` heads). Single attempt (30 runs), as measured.
No rescoring. Not a new design, not a home re-run, not a fresh-56
re-run.

## Results (pairs 475009, 475018; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 40+41+41
pooled; matched groups 17/22 per history. All 30 runs complete; BCR
survival 0.32–0.71 (harsh middle tasks, disclosed).
- Birth probes: copy 0.0079 vs mut 0.0088 vs naive 0.0002
  (pre-gap mut +0.0087).
- Post-BCR probes: copy 0.0094 vs mut 0.0089 vs naive 0.0059
  (post-gap mut +0.0030 — clears +0.002; mutPost > 0).
- Mut fraction 0.35 < 0.5 → **NOGO** (`GEN1-MUTHOME2-NOGO-V1`).
  Copy fraction 0.44 descriptive (also fails).
- Per-seed mut (descriptive, user question): 475009 pre +0.0116 →
  post +0.0061 (fraction 0.53 — CARRIES); 475018 pre +0.0057 →
  post −0.0001 (fraction −0.02 — fully eroded). One pair carries,
  one does not. The eroding pair is naive catch-up (naive
  0.0022 → 0.0086 through BCR immersion), not mut collapse
  (mut 0.0079 → 0.0085 holds).

## Reading
The replication reverses the headline: pooled GO-by-dust (V1, frac
0.72) → NOGO (V2, frac 0.35), both carried by one pair and dragged
by the other (V1 0.80/0.29; V2 0.53/−0.02). The mechanism is visible
and consistent across all four bank-pairs: return-practice lets the
naive arm learn the original cues from scratch through immersion,
while mutated offspring start high and hold — the gap is a race the
naive arm sometimes wins. Mutated inheritance survives gauntlet +
return at the pair level about half the time (2/4 bank-pairs carry:
474991, 475009), not as a pooled law. The bar held; the verdict is
NOGO. Neither bank licenses a claim that mutated transmission
reliably survives return-practice. Line closed as scored.

## Preservation
`evidence/gen1-muthome2-dev/fresh-57/` (bank, now spent) +
`evidence/gen1-muthome2-dev/attempt-01/` (untracked raw evidence,
~1.4M, 30 rows with tn=0.05 + BCR provenance).
