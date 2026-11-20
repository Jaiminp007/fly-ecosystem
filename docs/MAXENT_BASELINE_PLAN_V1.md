# MAXENT-BASELINE Plan V1 — information content of turn-gating (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — zero new worlds under this plan, now and
forever (read-only measurement on frozen artifacts). Implementation computes the
specified quantities deterministically; re-running on the same artifacts must give
bit-identical results.

## Rationale (decades-old debt — R46 specified this twice, never executed)

TURN-GATE's headline (candidate turn|harmful 0.81–0.83 vs unlearned flat ≈0.00) has
never been expressed in information units (R46 Shannon prescription) nor compared
against its MaxEnt null. This plan retires that debt on frozen rows only.

## Data (frozen, read-only — never regenerated, never rescored)

`evidence/turn-gated-dev/attempt-01/rows/*.json` (12 rows: 6 histories ×
{candidate, unlearned}, TURN-GATE V1). Row schema (audited 2026-11-02):
`summary.cues` maps cue-bits → {contact, pause, turn, beneficial, harmful, label}.
No other artifact set is touched. No engine code is touched.

## Computation (exact, pure functions in `scripts/maxent-baseline.mjs`)

Per arm (candidate/unlearned), pooled over the 6 histories:
- Contacts and turns split by label: H = Σ harmful-contact cues (contact count),
  Th = Σ turn on harmful cues; B, Tb analogously for beneficial. (Cue-bits key →
  label field; contact/turn are integer counts. Cues with zero contact contribute nothing.)
- Rates: pTurnHarm = Th/H, pTurnBen = Tb/B, marginal pTurn = (Th+Tb)/(H+B).
- Mutual information (nats→bits, log2): I(action; valence) over the 2×2
  {turn,cruise}×{harmful,beneficial} joint table with Laplace smoothing α=1 per cell
  (pre-registered; avoids log(0) on sparse cues — smoothing choice documented, not tuned:
  α=1 is the standard uninformative prior, fixed here).
- MaxEnt null: the marginal-matched zero-information policy — turns at pTurn
  independently of valence (I=0 by construction; predicted turn|harm = turn|ben = pTurn).
  Reported alongside the uniform coin-flip (p=0.5) null for scale.
- Consistency check (pre-registered, descriptive): the unlearned arm's measured I
  should be ≈0 bits (flat behavior) — i.e., the MaxEnt null should DESCRIBE the
  unlearned arm. If not, the row schema is misunderstood (halt, do not reinterpret).

## Outputs (measurement, NO gates, NO verdict)

- `docs/MAXENT_BASELINE_RESULTS_V1.md`: per-arm rates, I in bits, MaxEnt-null
  predictions, unlearned-consistency check, and the comparison the R46 spec demanded
  (MaxEnt baseline vs greedy/learned on frozen rows).
- Fixtures (in `tests/maxent-baseline.test.mjs`, synthetic tables only, zero bank
  worlds): exact-bits on a hand-checkable 2×2 table; Laplace handling of zero cells;
  marginal-null I≡0 identity; unlearned-like flat table → ≈0 bits; cue-key/label
  parsing incl. zero-contact cues.
- No claim beyond the numbers. No RSI implication. No follow-up licensed by this
  document (any use of the bits in a gate needs its own frozen plan).
