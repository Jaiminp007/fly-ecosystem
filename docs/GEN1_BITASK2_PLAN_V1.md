# GEN1_BITASK2 PLAN V1 (frozen 2026-11-04) — retry of the recombined-novel-task cell on a fresh bank (BITASK V1 voided NOGAP)

## Why this line, and only this one
BITASK V1 voided bank-conditionally: pair 2 provided no birth A-gap
(+0.0014), so the novel-task question was untestable there — the
results doc explicitly licenses a retry with a fresh bank under the
same frozen plan. This is that retry: identical instrument, fresh
bank `fresh-84` (475513–475530), fresh triage (490667–490675). The
task matrix's last cell (recombination × novel task B) remains the
only untested birth-transmission contrast; maternal/mut/social all
NOGO task-bound. If biparental birth inheritance holds on both pairs
here, the B-gap decides the cell; if the bank again provides no
A-gap on a pair, the line voids again (no third attempt without a
new rationale — two voids close the cell as bank-unfavorable).

## Pipeline (identical to BITASK V1)
Per history: 1 train + 11 probes, 2 histories, 24 runs. TrainA
(512, A≠init digest gate else INVALID), skill pair 256 (skillT >
skillN else INCOMPLETE-NOSKILL), three birth colonies
(BTB_BIRTH_TICKS=900: bi-mixed/biparental + copy-maternal +
naivekid/none, A1 mating, frozen newborns), matched-N frozen A-probes
256 (birth-gap gate) + frozen B-probes 256 via `enterPhaseB8s`
(novel task, no learning). Pooled offspring/arm ≥ 4 else
INCOMPLETE-LOWBIRTHS (void; window bar).

## Verdict (per-pair, both pairs, frozen — BIRTHCARRY bar family)
- A-digest unmoved → INVALID.
- skillT ≤ skillN → INCOMPLETE-NOSKILL.
- pooled births/arm < 4 → INCOMPLETE-LOWBIRTHS.
- A-gap (birth bi−naive on task A) ≤ +0.002 either pair →
  INCOMPLETE-NOGAP (void; second void closes the cell).
- Else GO (`GEN1-BITASK2-GO-V1`) iff FOR EACH pair B-gap bi−naive >
  +0.002; else NOGO. Copy B-gaps + A-gaps descriptive.
No rescoring. Single attempt.

## Discipline
- Fresh bank `fresh-84` main 475513–475530 (2 histories × 9, 18
  unique, whole-token clean); triage throwaway 490667–490675 (9).
  Never regenerate spent banks (BITASK V1 fresh-83 + triage
  490658–490666 now spent).
- Fixtures `tests/gen1-bitask2-dev.test.mjs` 8/8 green pre-run
  (zero worlds); triage full pipeline BEFORE bank mint (A-digest
  moves + mixed placement verified + crossover spot-check + births
  pooled ≥ 4 + A-probes show gap + B-entry + B-probes complete).
- BT caps; ~1.3M expected; disk floor 1 GB (stop below; do not trust
  a 1G df reading); free ~28G at plan time.
- No new food/sensors/actuators; no gauntlet; no return practice;
  matched 256-tick probes; novel task = engine B codebook, frozen.
