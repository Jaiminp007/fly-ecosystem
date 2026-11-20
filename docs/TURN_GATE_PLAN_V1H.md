# TURN-GATE Plan V1h — gain deployment + confirmation with compounding (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

V1g: gain-only boost clears the +0.1 band borderline (+0.104, heterogeneous:
pairs 1,3 large, pair 2 zero; manipulation fired; retention intact) while
selection-alone (T3, +0.066) and bundle (+0.062, sub-additive) do not.
Two open items: (1) does the gain effect REPLICATE on a fresh bank
(borderline + heterogeneous demands confirmation, not celebration)?
(2) does the boost COMPOUND with extended exposure (the deployment-
relevant question — V1d showed exposure alone closes ~1/3 per doubling;
does boosted exposure close faster/further)?

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1g), all
arms 1792 ticks:

- **train** (base `BT_LEARNER_OPTIONS`) — transplant source for uniform +
  gain-seg1 (uniform training isolates the extinction window, unchanged).
- **transferred** = uniform (base) — the V1c-replication arm; carries the GATES.
- **transferred-gain** (base + `surpriseGain:1.0` + `replaySurpriseGain:3`,
  tournament 1 — IDENTICAL values to V1g, no re-tuning) — the deployment
  candidate; confirmation arm.
- **transferred-gain-seg2** (same gain opts; transplant of GAIN-seg1-END
  weights; cumulative 2×1792 boosted ticks) — the compounding arm.
- **unlearned** (base, frozen) — flat control.

5 arms × 3 pairs = **15 mains**, 0 probes (ledger: 26880 ticks, 645120
founderSlots expected). Same transplant machinery (snapshot/copy/
assertFreshTarget/integrity + digest). Rows that source a transplant
(train, gain-seg1) persist weights; uniform, gain-seg2, unlearned are
terminal (digest record suffices).

## Gates (seg1-gated verdict; gain arms descriptive)

Identical bars on train + uniform + unlearned: G1 integrity on ALL 15 rows
(join ≥0.99; gain + gain-seg2 triples REQUIRED present fail-closed, never
gating) + G0 train ≥0.5 all 3 else INCOMPLETE-UNTRAINED + G2a uniform mean
≥0.3 + G2b unlearned flat ≤0.1 all 3. Verdict PHASE-H-GO/NOGO
(+INCOMPLETE/INVALID fail-closed). Null-hygiene carried over
(train/uniform/unlearned surprise counters == 0 else INVALID). Mechanism
replication on uniform (7th check, non-gating).

Descriptive intervention tests (same +0.1 band as V1f–V1g — the yardstick
is fixed across all three lines so dose/bank comparisons are commensurate):

- **D1-replication:** HB(gain-seg1) − HB(uniform). Expect >+0.1
  (confirmation of V1g D2 on a fresh bank). Pre-registered stop rule:
  if D1 < +0.1 with fired manipulation, the gain effect does NOT
  replicate → surprise-replay CLOSES as non-robust (falsified at these
  doses; V1g's borderline does not survive) and the program pivots to
  non-replay extinction mechanisms. No further escalation without a new
  rationale — the stop rule has teeth both ways.
- **D2-compounding:** HB(gain-seg2) − HB(gain-seg1) (within-line
  increments; no band — first measurement). Positive = boost compounds
  with exposure; ≈0 = boost saturates immediately (one-shot correction);
  negative = boost interferes with extended exposure (regression under
  continued boosting — distinct from V1d's null-hygiene... note as
  mechanism signal, not instrument failure).
- **D3-deployment:** HB(gain-seg2) − HB(uniform) (boosted+extended vs
  plain 1×). Report; the number a deployment would actually realize.
- Same-val diffs ≈ 0 (guardrail, reported not gated); BH ceiling no-claim
  (unchanged); pair-2-zero heterogeneity explicitly re-examined (does the
  fresh bank show a similar non-responder pair? reported, not gated).
- Manipulation: gain-seg1 AND gain-seg2 each need Σ `replaySurpriseBoosts`
  > 0 (else that arm's comparison VOID — a seg2 void with seg1 fired is
  itself informative: the boost stopped firing); tournament needs none
  (no tournament arm in V1h).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-08/`: 6 histories × 9 = 54 seeds
413001–413054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 412001–412054 + all fixture seeds). All arms reuse test histories.
Caps: ≤300 exec (15 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single
authorized attempt; crash-resume with dual provenance only. Fixtures must
guard the gain options (base+2 keys @1.0/3, identical to V1g — the
independent variable is HELD, not tuned) plus BH/HB splits, subsetGap,
agentWork/sumManipulation, scorer branches incl. all intervention triples
required, and the null-hygiene INVALID override. No RSI claim.
