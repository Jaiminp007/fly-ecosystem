# RSI-TRANSFER V1 verdict (2026-11-03) — NOGO (loop change transfers vs
fixed, not vs unlearned)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output 1.2M + 1.2M duplicate-debug artifact, see below). Frozen plan
`docs/RSI_TRANSFER_PLAN_V1.md`. New combination (self-proposed rate change
+ independent same-codebook transfer eval — the SELF line never transfer-
tested; C-series tested external revisions only). Fixtures 7/7 green
pre-run (zero worlds); bank 473064–473099 minted post-fixtures. Single
attempt (one crash-resume, disclosed below).

## Execution note (packaging fix, zero mechanism change)
First launch completed all 6 trains then crashed on the first probe:
adopted rate 2.0 exceeds the TasteEnergyBody constructor cap (≤1.0)
while the loop menu allows 2.0 (live adoption bypasses the constructor
via direct config set). Fix (3 lines + 1 fixture, all green): probes apply
the adopted rate post-construction via the IDENTICAL live-application
path (`state.config.tasteRate=propRate`) instead of the constructor —
the evaluated change IS the adopted change (clamping would test a
different change). Loop bounds [0.05,2.0] still enforced. Resumed with
dual provenance (attempt.json carries pre-fix sources, dev-results
post-fix; redone[] lists the 6 probe rows). `evidence/rsi-transfer-dev/
attempt-01b/` is a duplicate-debug artifact (deterministic re-execution
of the 6 trains during diagnosis, no probes) — superseded by the resumed
attempt-01, preserved untouched.

## Results, pairs (473064→473073, 473082→473091), G1+G2 pass, 35 adopts
Transfer endpoint means (higher = better):
- selfmod (adopted rate 2.0 both pairs): −61.21.
- fixed (rate 1.0): −63.41.
- unlearned (never learns): −60.13.
Verdict: **RSI-TRANSFER-NOGO-V1** — selfmod > fixed (+2.2) but <
unlearned (−1.1). Bar required beating BOTH controls.
Train texture (descriptive): fixed (−58.2/−59.9) > selfmod (−59.7/−60.1)
> unlearned (−64.4/−64.5) — echoes V1b (selection slightly harmful on
train); on transfer the order flips to unlearned > selfmod > fixed.
Lifetime learning helps train and hurts transfer here; the loop's change
splits the difference but cannot overcome the learning-vs-not gap —
consistent with the V2 tax, extinction, and reset-probe lines.

## Reading
The mechanism fired (35 adopts, rates 2.0 both pairs, digests intact)
and its change transfers better than no-loop learning — but transfer
belongs to the never-learner, so the product question stays closed and
the saturation/selection-failure diagnosis stands (now with transfer
evidence, not just train gaps). No successive-revision/RSI/retention/
population claim. Next: cross-codebook transfer stays unlicensed (needs
its own rationale — this line does not open it on a NOGO).

## Preservation
`evidence/rsi-transfer-dev/fresh-01/` (bank, now spent) +
`evidence/rsi-transfer-dev/attempt-01/` (resumed record, 1.2M) +
`attempt-01b/` (duplicate-debug artifact, preserved).
