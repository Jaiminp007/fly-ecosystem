# TURN-GATE Plan V1f — extinction-targeted surprise replay (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

Floor attribution (read-only, zero worlds): the transfer-tax residue is
EXTINCTION failure — harm→ben cues stall (~0.29→0.67 over 4 segments)
while ben→harm cues converge by seg2 (~0.80→0.95). The engine already
contains a null-default surprise-replay bundle (taste-energy.mjs):
tournament selection by squared prediction error (`replayTournament`),
rate boost on suprathreshold errors (`replaySurpriseGain`, needs the
`surpriseGain`-maintained EMA), all separately metered
(`replaySurpriseBoosts`, `surpriseBoosts`). Does surprise-gating replay
accelerate extinction of stale turn associations?

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1e),
all arms 1792 ticks (seg1-equivalent exposure — the level with maximum
headroom, gap 0.51; multi-segment intervention is V1g's job):

- **train** (base `BT_LEARNER_OPTIONS`) — transplant source for all three
  test arms. Uniform training isolates the intervention to the extinction
  window (test-phase replay mode is the ONLY difference between arms).
- **transferred-uniform** (base) — the V1c-replication arm; carries the GATES.
- **transferred-tournament** (base + `replayTournament:2`) — pure
  selection effect. Single-knob diff, no live changes, no rate changes,
  billing provably neutral (same draws/updates, different winners).
  Needs no EMA (scores compute err² directly).
- **transferred-bundle** (base + `surpriseGain:0.5` + `replaySurpriseGain:1`
  + `replayTournament:2`) — full surprise-sensitivity (live-boost +
  replay-select + replay-boost). Values are minimal-nonzero
  (weakest selection, weakest doubling, in-program 0.5 precedent from
  RSI-V1b) — a minimal-intervention ladder, not tuning (first
  measurement; stronger settings are V1g's escalation path).
- **unlearned** (base, frozen) — flat control, unchanged.

5 arms × 3 pairs = **15 mains**, 0 probes (ledger: 26880 ticks,
645120 founderSlots expected). Billing symmetric by construction
(fixed `replayPasses:4` budget all arms; tournament changes selection
within budget; gain changes rate magnitudes, not op counts — all metered
through `m` identically).

## Gates (uniform-gated verdict; intervention descriptive)

Identical bars on train + uniform + unlearned: G1 integrity on ALL 15
rows (join ≥0.99; tournament+bundle triples REQUIRED present
fail-closed, never gating) + G0 train ≥0.5 all 3 else
INCOMPLETE-UNTRAINED + G2a uniform mean ≥0.3 + G2b unlearned flat ≤0.1
all 3. Verdict PHASE-F-GO/NOGO (+INCOMPLETE/INVALID fail-closed).
Seg1 mechanism replication on the uniform arm (same ≥0.85 AND flipped in
[0.4,0.7], 5th check, non-gating).

Null-arm hygiene (fail-closed, NEW): Σ `surpriseBoosts` ==
Σ `replaySurpriseBoosts` == 0 across train+uniform+unlearned rows —
null arms must be null. Violation → INVALID (instrument broken, not a
scientific outcome).

## Descriptive intervention tests (non-gating; void-conditions pre-registered)

Flip-split extended (additive) with direction subsets: flippedBH
(train-benign→test-harmful; ceiling ~0.95, NO CLAIM either way —
headroom absent by seg1) and flippedHB (train-harmful→test-benign; THE
extinction subset). Report per arm; compare:

- D1: HB(tournament) − HB(uniform). Expect >0 (selection accelerates extinction).
- D2: HB(bundle) − HB(uniform). Expect >0 (surprise-sensitivity accelerates).
- D3 guardrail: same-val diffs ≈ 0 (large deviations = intervention breaks
  retention; reported, not gated).
- Meaningful-difference band: +0.1, grounded in the measured V1d
  seg1→seg2 flipped increment (+0.12) — "matches a full extra segment of
  exposure." Calibrated on frozen prior evidence (V1c-band precedent),
  NOT on the fresh bank.
- Manipulation validity: bundle comparison VOID unless
  Σ `replaySurpriseBoosts` > 0 over bundle rows (the gain path fired);
  tournament needs none (structural, always selects). Uniform-arm zeros
  double as the negative control. A void comparison is reported as VOID,
  never as "no difference" (V1d INTERMEDIATE-gap precedent: don't let the
  code lie by omission).

Interpretation mapping (recorded separately from the verdict):
- D1,D2 > +0.1 → surprise-gating accelerates extinction → V1g decomposes/deploys.
- D1 > +0.1, D2 ≈ 0/void → selection works, boost adds nothing → V1g = tournament-only line.
- D1 ≈ 0, D2 > +0.1 → selection insufficient, boost/live needed → V1g = gain line.
- Both ≈ 0 → minimal settings don't move extinction → V1g escalates settings or changes mechanism (kill-or-escalate with reason, not default-continue).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-06/`: 6 histories × 9 = 54 seeds
411001–411054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 410001–410054 + all fixture seeds). All arms reuse test histories.
Caps: ≤300 exec (15 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single
authorized attempt; crash-resume with dual provenance only. Fixtures must
assert the options contrast exactly (tournament = base+1 key, bundle =
base+3 keys) — the independent variable is fixture-guarded. No RSI claim.
