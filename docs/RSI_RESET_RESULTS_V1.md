# RSI-RESET V1 verdict (2026-11-03) — INCOMPLETE-NORESET (void; loop never fired)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output 1.2M). Frozen plan `docs/RSI_RESET_PLAN_V1.md` + Amendment
A1 (single-option taste reset). New proposal family (targeted forgetting
— never proposed anywhere). Fixtures 7/7 green pre-run (zero worlds; one
fixture initially failed on a renamed export, fixed pre-run with zero
mechanism impact); bank 473244–473279 minted post-fixtures. Single
attempt, as measured. No rescoring (all lines stand).

## Fixture note (pre-run correction, disclosed)
Initial fixture run: 6/6 (the 7th test, added with the amendment-era
probe-wiring check, initially failed on a renamed export; fixed pre-run,
re-greened — zero mechanism impact).

## Results, pairs (473244→473253, 473262→473271 — wait, actual pair seeds per bank)
G1+G2 pass (ledger exact 12 mains, digests match, configs audited).
Proposals: 133 keeps + skips, **0 adopts, 0 freezes-resets**.
Transfer means (descriptive only — verdict is void):
selfmod == fixed exactly (no adoptions → identical trajectories) <
unlearned (never-learner best again, as in V1/V1b/V1c).
Verdict: **INCOMPLETE-NORESET** — without an adopted reset the contrast
collapses toward a V1 repeat, which is forbidden; the world is voided,
not scored NOGO.

## Reading (the void is informative, not empty)
133 sandbox evaluations unanimously preferred keeping full-history
weights over refitting from zero on the fit window: by this probe there
is NO detectable taste-overfit — more history predicts the held-out test
better than fit-only relearning, at every checkpoint of both histories.
That cuts against the V1-overfit rationale that motivated the line (the
saturation V1 saw lives elsewhere, or needs a different detector), and
it was measured, not assumed: the loop looked 133 times and declined.
Keep recs carry null errCand by design (single candidate, no loser to
report) — margin distribution unavailable; a licensed follow-up would
log losing margins. No successive-revision/RSI/retention/population
claim. Next: only on a fresh rationale (e.g., later test windows,
different detector) — the reset family as built is closed on this void.

## Preservation
`evidence/rsi-reset-dev/fresh-01/` (bank, now spent) +
`evidence/rsi-reset-dev/attempt-01/` (untracked raw evidence, 1.2M).
