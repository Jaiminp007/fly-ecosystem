# MATE-SOCIAL Plan V2 — conditional + recency-weighted copying (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses V2; mechanism fix, not retest)

V1 closed the transmission-mechanism space on an exact neutral (copybest 1
= maternal 1, same history/lineage): unconditional copying in a
one-generation window changed nothing, and the bottleneck was read as
encounters. Two literatures say that null was PREDICTED, not surprising:
Rogers (unconditional copying in short windows is neutral-to-harmful at
population level) and R82's copy-when-uncertain program (V1 copied
regardless of recipient state, with a lifetime-success indicator that
lags a drifting ecology). V2 tests the theorists' conjunction: copy ONLY
when the recipient line is uncertain AND from the most-recently-successful
donor. If conditional copying lifts compounding where unconditional copying
flatlined, the bottleneck was the COPY RULE (indiscriminate + stale), not
encounters — and the transmission-mechanism space reopens. If it also
flats, unconditionality is exonerated and the downstream reading stands.
This is new rationale per V1's "no V2" clause: mechanism-specific fixes
for the identified failure modes (R82-specified gate + R82/R116 recency),
not a retest and not a knob re-parameterization (donor rule and gate are
both new, pre-registered, first-use).

## Knob (single mode + one record; TasteExperiment-centered, tiny engine touch)

`verticalTransmission='copyconditional'` (enum extension alongside
none/maternal/copybest/biparental; validated in TasteExperiment like its
siblings; symmetric billing: zero new billed ops — see below):

- **Gate (frozen):** at newborn sync, mOff = founderOffspring[motherId] ?? 0
  where motherId = f.parents[0]. **Ordering pinned:** founderOffspring is
  incremented for the newborn's own parents BEFORE the copy decision (same
  order as V1's counting line), so mOff INCLUDES the current birth: copy
  from a donor iff mOff ≤ 1 (maiden or first-birth line = uncertain);
  else inherit maternally (own line works = use it). First-ever births
  therefore copy parentally (donor == own lineage by construction) —
  pre-registered as expected behavior, not a bug: the gate is checkable
  (G-audit distinguishes arms by rule) even when outcomes coincide.
- **Donor (frozen):** most-recent-success rule. Engine records, in the
  shared birth path (same site as the birth event, all arms — symmetric),
  `lastSuccessBirth={tick, parentIds:[a,b]}` on every mating birth.
  At sync, donor = the more successful of the recorded pair by
  founderOffspring count, tie → lower id (V1's tie-break, unchanged).
  Fallback chain (frozen): no prior success yet → parental copy;
  chosen donor learner missing/invalid weights → other parent → parental.
- **Billing (frozen, audited):** zero new billed ops. Gate check (integer
  reads + compare) unbilled per branch-condition precedent; donor read is
  O(1) property reads (no scan — the record, not a lineage walk);
  policy copy is exact `.slice()` (V1-identical path, free like maternal/
  copybest copies; only founderOffspring counting + optional noise bill, as
  before). The record write itself is engine-side and unbilled per
  mating-block precedent (mate search, cooldowns, energy transfers all
  unbilled there). Symmetric by construction: all arms run the same
  record-write; only copycond reads it.
- **Checkpoint (frozen requirement):** lastSuccessBirth is plain JSON
  ({tick:int, parentIds:[int,int]}) and must round-trip through the
  existing World checkpoint path; implementation proves it with a restore
  fixture (V4 restore-recompute lesson: assert restored value equals live
  value). If the checkpoint schema is selective, the field is added (only
  permitted engine-touch besides the record write + validation, both
  null-default).

## Arms, bank, caps

- Arms (3): copycond (conditional + recency-weighted) vs copyalways
  (V1-EXACT replication: unconditional best-founder = 'copybest', same code
  path as V1) vs maternal (null control, 'maternal'). ALL ELSE HELD to V1:
  enriched 5.0 + bar 50 + decoupled (matingActionRequired false — V1 runner
  values verbatim). NO spread anchor (V1-parity: V1 ran 2 arms without one;
  the question needs copycond vs maternal with copyalways as the V1 check,
  not a topology reference; documented choice).
  6 histories × 3 arms = 18 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-social-dev/fresh-02/`: 6 histories **443001–443054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  443xxx verified pristine 2026-11-02 (zero exact-seed/registry/test hits
  across docs/scripts/tests/learning/engine; own-bank range owned by this
  plan). Builder re-verifies; post-bank refusal; union-excluded from all
  future qual banks via evidence-protocol scan. Spent = V1's list extended
  through all priors (379xxx–442xxx full union) + own 443001–443054.
- Caps (ML1 scale): 18 mains / 0 probes / 32256 worldTicks / 774144
  founderSlots / 30e9 aggregate ops (no new billing; headroom intact).

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: transmission per-arm ({copycond:'copyconditional',
  copyalways:'copybest', maternal:'maternal'}) via per-row 'transmission'
  field (MLR1 precedent — knob varies), frozen rule literal in attempt
  record (gate: maiden-line mOff ≤ 1 incl. current birth; donor:
  most-recent-success pair, more-successful parent, lower-id tiebreak;
  fallback: none → parental, invalid → other parent → parental),
  geography 1/3 from live worlds (hub topology — V1-identical),
  bar 50, nutrient 5.0, noise null, decoupled. Else INVALID.
- NO births gate (precedent, pre-registered).
- G-lift (rescue verdict): **MATE-SOCIAL-GO-V2** iff copycond gen-2 ≥ 2
  AND copycond gen-2 > maternal gen-2 (conditional copying lifts
  compounding where unconditional copying flatlined). Else
  **MATE-SOCIAL-NOGO-V2** (even theorists'-conjunction copying fails —
  bottleneck is not the copy rule; downstream reading confirmed).
- copyalways outcome DESCRIPTIVE (V1-replication check, non-gating):
  expected ≈ maternal per V1. Interpretation clause (pre-registered, not
  a gate): if copyalways ALSO beats maternal, GO stands but the published
  verdict MUST disclose "copying works here after all — conditionality
  unproven necessary."
- INCOMPLETE-NOBIRTHS if copycond gen-1 == 0 (void, not NOGO).
- Weight logging: conditional on coupled designs (unchanged standing rule).

The line closes with its verdict either way. No V3 without new rationale
(named candidates, not licensed: sex-conditioned leaving; detection-sharing
channel; prestige/success-bias donor rules; differentiation-first/mating-second).
Single authorized attempt, cumulative +18. No RSI claim.
