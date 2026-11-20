# GEN1-FEAST V1 verdict (2026-11-04) — NOGO (graze-then-starve, not feast-then-crash)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_FEAST_PLAN_V1.md`. New
instrument (per-32-tick series: total intake + mean alive energy + alive
count, full course). Fixtures 7/7 green pre-run (zero worlds; one
laziness repair — flat-shape helper parametrization — zero mechanism
impact); triage on throwaway 490100–490108 (completion + zero toxin +
8 populated bins). Bank 474379–474396 minted post-triage, verified
clean. Single attempt, as measured. No rescoring, no resume.

## Results (pairs 474379, 474388; frozen naive, 48 energy; repro off)
Manipulation passes (fresh toxin ~0); deep gate passes (feast-ratio
1.00 flat, survival 0.958 both — steady instrument, depletion intact).
Fresh: feast-ratio 0.98 (< 2.0 — NO front-loading) BUT crash present
(6+4 deaths, late/peak energy 0.465 < 0.6). Feast required and absent
→ **NOGO** (`GEN1-FEAST-NOGO-V1`).

## Reading (the crash is real; the feast isn't — graze-then-starve)
Per-32-tick series (both histories agree): intake FLAT (~24–28/bin)
for the first ~768 ticks, then fading (19 → 8–15/bin) — steady grazing
that exhausts the world, no early gorge. Energy NEVER rises (peak at
bin 0, placement 48; slow bleed ~47 → collapse ~20–25 late). Deaths
cluster ~1450–1785 (8+4, all energy). No oscillation at 32-tick
resolution (monotonic fade, not cycles).
- The density inference (food-limited, energy-mediated) STANDS — but
  the SHAPE is gradual depletion, not sharp boom-bust. Nothing gorges,
  so there is nothing to pace: the lever is total food (density V1) or
  efficiency, not pacing/oscillation. The frozen sharp-feast hypothesis
  is falsified as stated; the gradual variant is what the datum shows.
- Deep control is flat throughout (intake ~constant, energy ~constant,
  23/24 alive at truncation) — steady-state as designed; the dynamics
  are fresh-specific.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-feast-dev/fresh-22/` (bank, now spent) +
`evidence/gen1-feast-dev/attempt-01/` (untracked raw evidence, ~1M;
full 56-bin series + per-agent sums/causes + exact death ledgers).
