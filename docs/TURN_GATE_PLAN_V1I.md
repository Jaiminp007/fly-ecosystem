# TURN-GATE Plan V1i — boost×exposure interaction at matched 2× (DESIGN ONLY, FINAL chartered transfer experiment)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt. After V1i's verdict
is published, the TURN-GATE line CLOSES (all findings published; no V1j
licensed by this plan — any further transfer work needs a new rationale +
new frozen plan, not an extension).

## Question

V1h: gain-boost replicates (D1 +0.134 ≥ +0.1) and compounds over segments
(D2 +0.260 seg2−seg1; D3 +0.393 seg2−uniform-seg1). But D3 confounds replay
mode with exposure (gain-seg2 has BOTH boost AND 2× exposure vs uniform
1×). The clean interaction question: at MATCHED 2× cumulative exposure,
does boosted replay beat plain replay (E1)? Plus replications of both
segment trajectories on a fresh bank (E2 uniform, E3 gain).

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1h), all
arms 1792 ticks — two parallel 2-segment chains sharing one train:

- **train** (base `BT_LEARNER_OPTIONS`) — transplant source for uniform-seg1
  + gain-seg1 (uniform training isolates the extinction window, unchanged).
- **transferred** = uniform-seg1 (base; the V1c-replication arm; carries
  the GATES) + **transferred-seg2** = uniform-seg2 (base; transplant of
  uniform-seg1-end weights; plain-exposure trajectory arm).
- **transferred-gain** = gain-seg1 (base + `surpriseGain:1.0` +
  `replaySurpriseGain:3`, tournament 1 — V1g/V1h-IDENTICAL values, HELD
  not tuned) + **transferred-gain-seg2** (same gain opts; transplant of
  gain-seg1-end weights; boosted-exposure trajectory arm).
- **unlearned** (base, frozen) — flat control.

6 arms × 3 pairs = **18 mains**, 0 probes (ledger: 32256 ticks, 774144
founderSlots expected). Same transplant machinery (snapshot/copy/
assertFreshTarget/integrity + digest), applied 4× per pair. Train +
uniform-seg1 + gain-seg1 rows persist weights (chain sources); seg2 arms +
unlearned terminal.

## Gates (seg1-gated verdict; everything else descriptive)

Identical bars on train + uniform-seg1 + unlearned: G1 integrity on ALL 18
rows (join ≥0.99; uniform-seg2/gain/gain-seg2 triples REQUIRED present
fail-closed, never gating) + G0 train ≥0.5 all 3 else
INCOMPLETE-UNTRAINED + G2a uniform-seg1 mean ≥0.3 + G2b unlearned flat
≤0.1 all 3. Verdict PHASE-I-GO/NOGO (+INCOMPLETE-UNTRAINED/INVALID
fail-closed). Null-hygiene carried over (train/uniform/uniform-seg2/
unlearned surprise counters == 0 else INVALID; tournament absent —
nothing to check). Mechanism replication on uniform-seg1 (8th check,
non-gating).

Descriptive (non-gating; +0.1 band fixed for D0/D1/E1 — the yardstick's
4th consecutive use):

- **D0-replication:** HB(gain-seg1) − HB(uniform-seg1), expect >+0.1 (3rd
  measurement: V1f +0.064 [miss], V1g +0.104 [hit], V1h +0.134 [hit]).
- **E1-interaction (the headline):** HB(gain-seg2) − HB(uniform-seg2) at
  matched 2× exposure, expect >+0.1. Isolates replay mode from exposure.
- **E2-uniform-trajectory:** HB(uniform-seg2) − HB(uniform-seg1), no band
  (replicates V1d's +0.12 segment increment on a fresh bank; compare
  contextually, not as a test).
- **E3-gain-trajectory:** HB(gain-seg2) − HB(gain-seg1), no band
  (replicates V1h D2's +0.26; contextual comparison only).
- Same-val diffs ≈ 0 (guardrail, all arms); BH ceiling no-claim (unchanged).
- Manipulation: gain-seg1 AND gain-seg2 each need Σ `replaySurpriseBoosts`
  > 0 else that arm's comparison VOID (seg2-void-with-seg1-fired =
  informative, V1h precedent); segregation of void risk per arm (a void
  seg2 does not void seg1).

Interpretation mapping (recorded separately from the verdict):
- E1 > +0.1 (with fired manipulation both arms): boost beats plain
  replay head-to-head at matched exposure → surprise-gating CONFIRMED as
  the better 2× deployment; V1j NOT needed for the interaction question;
  line closes with a deployed recommendation.
- E1 ≈ 0 (±0.1 band) with fired manipulation: boost's edge does not
  survive matched exposure (plain replay catches up by seg2) → the V1h
  D3 deployment gap was exposure-driven after all; surprise-gating is a
  1× accelerator, not a 2× advantage → line closes with a bounded claim.
- E1 < −0.1 with fired manipulation: boost UNDERPERFORMS plain replay at
  2× (late-onset overdose/interference) → line closes with a caution;
  deployment = seg1-only boost.
- Any VOID: that comparison unanswered (reported as void); the rest stand.

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-09/`: 6 histories × 9 = 54 seeds
414001–414054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 413001–413054 + all fixture seeds). All arms reuse test histories.
Caps: ≤300 exec (18 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single
authorized attempt; crash-resume with dual provenance only. Fixtures must
guard the HELD gain values, the 6-tag scorer with all required triples,
BH/HB splits, subsetGap, agentWork/sumManipulation, and the null-hygiene
INVALID override. No RSI claim.
