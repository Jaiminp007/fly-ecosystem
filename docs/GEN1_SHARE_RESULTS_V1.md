# GEN1-SHARE V1 verdict (2026-11-04) — NOGO (saturated alert changes nothing)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_SHARE_PLAN_V1.md`. New
instrument (alert rule: any intake >0.2 doubles all sensor ranges for
32 sliding ticks; baselines recorded/restored; frozen taxis/motor
untouched). Fixtures 7/7 green pre-run (zero worlds; one laziness
repair — pooled-count expectation — zero mechanism impact); triage
on throwaway 490136–490144 (169 events/256 ticks — rule fires
constantly (not rare); alert applies + restores + completes) BEFORE
bank mint. Bank 474451–474468 minted post-triage, verified clean.
Single attempt, as measured. No rescoring.

## Results (pairs 474451, 474460; frozen naive, 48 energy; repro off)
Rule-fired gate PASSES (events 923+1067, alertTicks 1792/1792 both —
saturated: the shared arm foraged with doubled range throughout).
Freeze held (all digests fixed). Survival: shared 0.563 (27/48) vs
asocial 0.563 (27/48) — EXACT TIE → **NOGO**
(`GEN1-SHARE-NOGO-V1`). Splits: shared losers 21/21 UNDER; asocial
20/21 UNDER + 1 NEVER — same count, same mode. Survivor medians
parity (asocial marginally higher). Deep 1.000/0.958 (reference).
All deaths energy.

## Reading (sufficiency, not discovery, binds — again)
- Saturated doubled sensing changes nothing: not survival, not loser
  count, not loser mode, not survivor intake. Wider view ≠ more food
  (distance-penalty makes far patches unworthwhile; and total stock
  is fixed — range cannot create food). The UNDER tail is a
  sufficiency problem (not enough per capita), and sharing the fact
  of discovery does not address it. Of course: loser V1 showed there
  was almost no NEVER to fix (1/42 dead here) — discovery already
  works; alert adds what is not missing.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-share-dev/fresh-26/` (bank, now spent) +
`evidence/gen1-share-dev/attempt-01/` (untracked raw evidence, ~1M;
alert ledgers + per-agent intake/cost + splits + causes + ledgers).
