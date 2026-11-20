# TURN-GATE Plan V1g — dose escalation + selection-vs-boost decomposition (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question

V1f: surprise-gating engages extinction weakly at minimal doses (D1 +0.042
tournament-T2, D2 +0.064 bundle, 6/6 positive but below the +0.1 band;
manipulation verified fired; retention intact). Is the effect dose-limited
(escalation clears the band) and which component drives it (selection vs
boost)? V1f left selection-vs-boost inconclusive (tournament ≈ bundle
within noise).

## Design

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1f), all
arms 1792 ticks (seg1-equivalent exposure — maximum headroom, direct V1f
comparability):

- **train** (base `BT_LEARNER_OPTIONS`, verified still null-default) —
  transplant source for all test arms (uniform training isolates the
  extinction window, V1f precedent).
- **transferred** = uniform (base) — the V1c-replication arm; carries the GATES.
- **transferred-tournament** (base + `replayTournament:3`) — selection
  escalation (T2→T3, best-of-3). Pure selection, no live/rate changes.
- **transferred-gain** (base + `surpriseGain:1.0` + `replaySurpriseGain:3`,
  tournament 1) — boost-only arm (live-boost enables EMA + 4× replay rate
  on suprathreshold records). Completes the decomposition V1f could not
  resolve: gain-only was the missing cell.
- **transferred-bundle** (base + T3 + gain 1.0 + replayGain 3) — full
  escalation. Same selection pressure as tournament-T3, so
  bundle−tournament isolates the boost contribution at resolving doses.
- **unlearned** (base, frozen) — flat control.

6 arms × 3 pairs = **18 mains**, 0 probes (ledger: 32256 ticks, 774144
founderSlots expected). Dose ladder (V1f → V1g): T2/G1/0.5 → T3/G3/1.0 —
one rung up each, still far from destabilizing extremes (T≤3 allowed max;
gains finite). Billing symmetric by construction (same passes, same
metering; tournament overhead and gain magnitudes billed identically
through `m`).

## Gates (uniform-gated verdict; intervention descriptive)

Identical bars on train + uniform + unlearned: G1 integrity on ALL 18 rows
(join ≥0.99; tournament/gain/bundle triples REQUIRED present fail-closed,
never gating) + G0 train ≥0.5 all 3 else INCOMPLETE-UNTRAINED + G2a
uniform mean ≥0.3 + G2b unlearned flat ≤0.1 all 3. Verdict
PHASE-G-GO/NOGO (+INCOMPLETE/INVALID fail-closed). Null-hygiene carries
over unchanged (train/uniform/unlearned surprise counters == 0 else
INVALID). Mechanism replication on uniform (6th check, non-gating).

Descriptive intervention gaps (same +0.1 meaningful band as V1f — the bar
is FIXED so escalation is measured against the same yardstick; moving it
would be tuning):

- D1: HB(tournament-T3) − HB(uniform). Expect >+0.1 (selection dose response).
- D2: HB(gain-only) − HB(uniform). Expect >+0.1 if boost matters alone.
- D3: HB(bundle) − HB(uniform). Expect >+0.1 (full escalation).
- Decomposition (at resolving doses): bundle−tournament ≈ boost
  contribution; gain-only vs tournament isolates single-component efficacy.
- Same-val diffs ≈ 0 expected (guardrail, reported not gated); BH ceiling
  no-claim (unchanged).
- Manipulation: tournament needs none (structural); gain-only and bundle
  each need Σ `replaySurpriseBoosts` > 0 on their rows else that arm's
  comparison is VOID (never "no difference").
- Overdose reading (pre-registered): any intervention arm with HB gap <
  −0.05 AND fired manipulation = OVERDOSE (destabilized learning),
  distinct from engaged-but-weak (≈0 with fired manipulation) and from
  void (manipulation failed). destab is information, not embarrassment.
- Cross-bank dose context (NOT tests, different banks): V1f D1 +0.042 /
  D2 +0.064 are reference points for whether escalation moved the needle,
  not baselines for gating.

Interpretation mapping (recorded separately from the verdict):
- Any D clears +0.1 → that component works at dose → V1h deploys it
  (possibly multi-segment: surprise through seg2+ per V1d trajectory).
- All D below +0.1 with fired manipulation → surprise-replay EXHAUSTED at
  reasonable doses (effect real but sub-therapeutic) → line CLOSES as
  exhausted (not failed) and the program pivots to non-replay extinction
  mechanisms (extinction-specific architectures, scheduled unlearning).
  NO infinite escalation treadmill — this is the pre-registered stop rule.
- Overdose pattern → inverted-U confirmed → V1h titrates DOWN to the peak.

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-07/`: 6 histories × 9 = 54 seeds
412001–412054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 411001–411054 + all fixture seeds). All arms reuse test histories.
Caps: ≤300 exec (18 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single
authorized attempt; crash-resume with dual provenance only. Fixtures must
guard the three option contrasts exactly (tournament = base+1 key @3;
gain = base+2 keys @1.0/3; bundle = base+3 keys) plus BH/HB splits,
subsetGap, agentWork/sumManipulation, scorer branches incl. all three
intervention triples required, and the INVALID-override path. No RSI claim.
