# TWO-FIRE SCOPING V1 — iterative revision within a run (DESIGN, not frozen)

Date: 2026-11-02. Status: DESIGN ONLY (no license, no bank, no code).
New structural idea (not a new operator): every C-line fires ONCE
per run (@1024). A two-fire loop would adopt, let the agent LEARN
UNDER the adopted operator, then re-evaluate on post-adoption
experience and revise AGAIN — second-order internal revision
(revise → observe consequences → revise). No C-line tested this.

## Why it matters (RSI-shape)

Single-fire adoption is open-loop (the loop never sees its effects).
Two-fire closes the loop within a lifetime: the second sandbox runs
on experience generated UNDER the first adoption. If the first
adoption was wrong, the second can correct it; if right, confirm it.
This is the closest structural analogue yet to "evaluate changes to
its own learning" (VISION's words) — the loop's product (adopted op)
becomes the next evaluation's context.

## Sketch (not frozen)

- `double` arm: fire @512 (choice or single-op, sandbox, adopt iff
  pass) → learn 512 ticks under adopted config → fire @1024 again
  (sandbox on accumulated experience, adopt iff pass).
- `single` control: fire @1024 only (C-verbatim), same menu/dose.
- `static` baseline + unlearned as usual.
- G2a: double-transfer vs static (successive +0.1 ×2). G2b-NEW:
  double vs single (does the second fire add value over one?).
- Lifetime: OL_LIFETIME_MAX=4 allows 2 fires × up to 3 evals... wait,
  choice ×3 evals ×2 fires = 6 > 4. Single-op per fire (menu 6 or
  2: 1 eval each, 2 total ≤ 4) fits; choice needs a lifetime raise
  (frozen-plan change — flag now: single-op recommended for the
  first two-fire line).
- Which op? Undecided (surprise = transfer-positive; gain 2.0 =
  sandbox-favorite). Scoping does not choose; freezing does.

## Open questions (must close before any freeze)

1. Does post-512 experience suffice for a second sandbox eval
   (record counts at 512 vs 1024 — MIN threshold)?
2. Billing: two flat fees per agent (still negligible vs 3.3e9)?
3. Transplant identity with mid-run adoption (same-arm exact —
   unchanged; adoptions are config, not weights)?
4. Is G2b (double vs single) the RSI gate, or does it need
   copied-improvement too (keep the copied arm? 5-arm design
   changes mains math)?

## Standing

- DESIGN only. The C-series closure is NOT reopened by this note
  (C13+ needs a FROZEN plan; this is its possible precursor).
- Zero worlds. Cumulative unchanged (8351).
