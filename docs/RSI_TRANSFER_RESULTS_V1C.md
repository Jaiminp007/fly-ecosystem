# RSI-TRANSFER V1c verdict (2026-11-03) — NOGO (freeze change loses to both)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output ~1.2M × 2 dirs, see preservation). Frozen plan
`docs/RSI_TRANSFER_PLAN_V1C.md`. New change (saturation-triggered
self-freeze, never proposed before — V1/V1b tested rate dials only).
Fixtures 17/17 green pre-run (zero worlds; V1b bank test
converted to post-spend refusal guard per standing order); bank
473154–473189 minted post-fixtures. Single attempt (one crash + resume,
then one clean re-run — disclosed below).

## Execution notes (two packaging fixes, zero mechanism change)
1. Billing-encoder crash on first launch: the new `lastKeepErr:undefined`
   baseline poisoned `encodedStateBytes` (prices whole learner state;
   chokes on undefined). Fixed to null-baseline (V1a uses null the same
   way) + fixture; 17/17 green. Crashed before the first checkpoint
   (no ledger, zero completed mains).
2. Resume-then-rerun: resume failed (no ledger.json exists pre-first-
   checkpoint, by design) → clean re-run into `attempt-03b` (the
   crashed `attempt-03/` partial contains zero completed mains and is
   preserved as-is). No completed world was run twice: the 6+6 mains
   exist only in attempt-03b. Dual provenance recorded in
   dev-results.json.

## Results, pairs (473154→473163, 473172→473181), G1+G2 pass
Loop behavior: 44 adopts + **2 freezes** (saturation-triggered freeze
fired, not void — both freezes mid-run, post-baseline as designed).
Final adopted rates 2.0/2.0 (probeRate selfmod both pairs).
Transfer means: selfmod **−61.18** vs fixed **−60.30** vs unlearned
**−59.26**. Verdict: **RSI-TRANSFER-NOGO-V1C** — selfmod loses to both
controls; the freeze change does not transfer above never-learned
(and not above plain learning either).
Texture: fixed > selfmod again (selection-harm echo, third line);
unlearned best everywhere (energy −59.3 here, births 14 in V1b).
The 2 freezes are descriptively consistent with retention (frozen
weights carried A-skill) but the pair means still trail init by ~1.9.

## Reading
Three transfer evals, same verdict: the loop fires (35/44 adopts, 2
freezes, digests intact) and every self-proposed change loses to
never-learned under independent eval — energy (V1), births (V1b),
energy-with-freeze (V1c). The product gap is now measured with the
freeze variant included. No successive-revision/RSI/retention/
population claim. Per the frozen plan this closes the loop-transfer
contrast family on the NOGO stop-rule; any further frontier needs a
genuinely new rationale, not another menu/schedule/proposal variant.

## Preservation
`evidence/rsi-transfer-dev/fresh-03/` (bank, now spent) +
`evidence/rsi-transfer-dev/attempt-03/` (crashed pre-fix partial, zero
completed mains, preserved) + `evidence/rsi-transfer-dev/attempt-03b/`
(the single complete attempt, 12 mains).
