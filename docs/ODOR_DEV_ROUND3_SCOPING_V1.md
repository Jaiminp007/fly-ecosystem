# ODOR DEV ROUND 3 SCOPING V1 — guard-feature augmentation (NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: SCOPED-embryonic (candidate +
outside legs recorded; open items listed; no license, no bank, no
code, no execution). Promoted by round-2 NO-GO per the frozen
mapping (rehearsal closed as a transfer fix).

## Candidate mechanism

Feed the learned steering policy two new input channels: the
`overlapGuard` viability boolean + requiredEnergy scalar (both
already computed every decision; the learned features carry
normalized energy but neither channel). New input, not tuning:
falsified if the guarded gap persists with the feature present
(policy-expressiveness, not information).

## Outside legs (R745 shielding file, filed unlicensed)

- Canonical shielding (Alshiekh): reward-max ≠ safety; reactive
  shield synthesized from a spec, introduced two ways. Round-3
  analogue: the viability gate as a synthesized shield over learned
  steering (not a learned weight).
- Easy shielding (Pranger): domain-knowledge model decides safety;
  limited adoption is the warning — the feature must be cheap
  (one boolean + one scalar) or it won't be used.
- Verification-guided (Corsi): external online component + verify.
  Round-3 analogue: the frozen scorer gates already play verifier;
  the feature is the shield.
- Robust probabilistic (Galesloot): safe-improvement baseline +
  restricted action space on fixed data. Round-3 analogue: frozen-A
  is the baseline; the gate restricts, never enlarges.

## Open items #1–#2 CLOSED (analytic; instrument read 2026-11-02)

- #1 feature encoding (frozen): append `[guard.viable?1:0,
  min(1, requiredEnergy/120)]` to the 8-dim steering features
  (energy-scale-consistent: the existing energy feature is
  energy/120). 8→10 dims. The boolean gates; the scalar grades
  the margin. Pre-registered, no tuning.
- #2 instrument change list: generalize `STEERING_FEATURES` in
  `learning/own-steering.mjs` to a constructor dim (default 8 —
  legacy path bit-identical); experiment passes dim 10 when the
  round-3 flag is set; `values`/`update`/`validate`/`reset` bound
  by `weights[action].length`, not the global const. Billing stays
  1 scalar op per op (counts scale with dim: decision 32→40,
  update 49→59 — billed honestly, negligible vs 27e9 scale).
  Round-1/2 code paths untouched when the flag is off.
## Open items #3–#5 CLOSED (analytic)

- #3 arms/probes: ONE new arm `learned-guard` on the ROUND-1
  FIXED curriculum (A512/B512/C512/D256 — rehearsal stays out of
  round 3; single-variable isolation: R1-learned vs R3-learned-guard
  differ ONLY in input channels) + full A/B/transfer probe suite
  (same 8 reused histories; R1/R2 rows reused read-only).
- #4 caps: round-2 actuals 26.98e9 → same 40e9 ops / 3600s wall
  (10-dim steering adds ~20 ops/decision — negligible).
- #5 verdict mapping (frozen): GO iff transfer gate (6/8 vs reset
  AND vs cheap native-full, nonnegative survivor diffs) AND A≥95%
  AND B≥95% AND guarded-comparison ≥6/8 positive with mean≥0
  (BEAT guarded, not just close it — direction-first,
  pre-registered). PARTIAL if transfer+A+B pass but guarded bar
  fails (feature helps generally, not specifically). Else NO-GO
  (guard-feature closed; information hypothesis dead).

Remaining: the frozen dev plan doc (mechanical from this scoping)
+ fixtures. Still NOT FROZEN, not authorized.

## What this is not

Not authorized. Not a bugfix re-run (different treatment: new
inputs). Round-2 NO-GO stands independently.
