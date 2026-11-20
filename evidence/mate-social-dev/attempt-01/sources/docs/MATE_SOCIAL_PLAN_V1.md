# MATE-SOCIAL Plan V1 — copy-successful vs maternal transmission (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Objective

Test whether adding SELECTION to transmission compounds lineage
success: newborns copy the weights of the highest-fitness founder
(copy-successful: Laland 2004; Henrich & McElreath prestige/payoff
bias) vs maternal exact copy (V1 control, exact-neutral). V1's null
(gap 0, 16/16 identical) is attributed to missing selection, not
missing fidelity (niche fingerprint: transplant starts at 100%
fidelity). This line supplies selection. If copy-successful beats
maternal, social learning is CONFIRMED as the mating track's missing
ingredient; if not, transmission mode doesn't matter at this scale
(either too few generations, or fitness differences too small to
exploit).

## Mechanism (engine delta, null-default, billed)

- New `verticalTransmission` mode `'copybest'` alongside 'maternal'/
  'mutant' (default remains 'maternal'; V1 behavior bit-identical
  when unset). Engine tracks per-founder lifetime offspring counts
  (increment sire/dam counters at each birth; 1 op per counter —
  billed uniformly on ALL mating runs, including maternal controls,
  preserving symmetric billing; null-hygiene: counters exist but are
  unread when mode is maternal).
- On birth under 'copybest': newborn's taste/actor/critic weights =
  exact copy of the currently highest-fitness founder's weights
  (ties → lowest founder ID; deterministic). No mutation (isolate
  selection from variation — V1b already tested mutation).
- Fitness metric (pre-registered, single): founder's TOTAL offspring
  count across the run to date (lifetime reproductive success).
  No energy/age weighting (keeps the comparison to one variable:
  WHO is copied).

## Arms, bank, caps

- Arms (2): maternal (V1-exact rerun = control; validates the bank
  can still produce the V1 null pattern... note: V1 ran at bar 65 with
  0 births; THIS line runs both arms enriched) vs copybest.
  Enriched ecology both arms (nutrientOverride 5.0, bar 50 — the only
  setting with gen-2 ever observed; per V1f/V1b precedent).
  6 histories × 2 arms = 12 mains.
- Bank `evidence/mate-social-dev/fresh-01/`: 6 histories
  426001–426054 (mating 6-history convention; drawn .seed
  {001,010,019,028,037,046}). 426xxx drawn set verified clean
  2026-10-26 (exact-token scan; float-substring hits elsewhere are
  outside the drawn set, harmless per standing precedent). Builder
  re-verifies at build; post-build refusal guard.
- Caps (V1b-mirror): 12 mains / 0 probes / 21504 worldTicks /
  516096 founderSlots / 2.5e9 scalarOperations.

## Gates, verdicts (conjunctive, fail-closed)

- G1 integrity: 12/12 complete, ledger exact, `redone: []`.
- G-validity (fail → INVALID): maternal arm must reproduce V1-class
  behavior in enriched ecology (gen-2 rate within V1b's observed
  range: maternal gen-2 ∈ {1..4} per 6 histories — sanity, not gate;
  hard gate is only structural: births occur, both arms valid
  ecologies). If the enriched ecology itself fails (zero births
  BOTH arms), verdict is INCOMPLETE-NOBIRTHS (ecology failed, not
  the mechanism — cf. V1's INCOMPLETE-NOMUTANTS precedent).
- G-gap (the verdict): copybest gen-2 ≥ 2 AND copybest gen-2 >
  maternal gen-2 (V1b bar, unchanged — replication fidelity, not
  tuning) → **SOCIAL-GO** (selection-via-copying CONFIRMED;
  licenses prestige/conformity multi-strategy meet per round 43,
  specified not executed). Else **SOCIAL-NOGO** (copying the best
  adds nothing over copying mother at this scale).
- Descriptive (non-gating): lineage concentration (founder spread
  per arm, V1c method); gen-3 occurrence if any; per-arm vigor
  (gen-1 lifespans, censored); whether copybest collapses to one
  lineage (diversity cost of success — QD-relevant).
- INCOMPLETE on halts; INVALID on structural failure.

The line closes with its verdict either way. No V2 without a new
rationale (e.g., multi-strategy tournament per Rendell, or
payoff-vs-prestige dissociation). Single attempt, cumulative +12.
No RSI claim.
