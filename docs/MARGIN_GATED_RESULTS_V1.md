# M-GATE results — Phase-D single attempt (CLOSED DEV-NOGO)

Frozen plan: `docs/MARGIN_GATED_PLAN_V1.md` + V1a–V1e. Verdict: **DEV-NOGO —
line CLOSED**. No Phase Q. No qual spent. All negatives preserved below.

## Verdict table (conjunctive; any fail closes)

| Bar | Result | Detail |
|---|---|---|
| G1 relevance | ✓ GO | n=37527 admitted, bad=0; tercile cut 0.101/0.207; loRate 0.431, hiRate 0.743, **gap 0.312 ≥ 0.10** |
| G2 effect | ✗ NOGO | bestTau=0 (tau-0.2 identical, see below): dA **−0.249** (bar ≥+0.15), dB −0.013 ✓, dL +0.152 ✓, alignUp ✓ |
| G3″ mechanism | ✗ NOGO | slowDir-zeros ✓ all histories; gen1-unalloc ✓; tau0-engaged ✓; billed-direction ✓ (dOps>0); **rng-identical ✗ on 382001 only** (retention/replay rng; feed/motor identical everywhere) |
| G4 caps | ✓ | 252 exec (96 mains + 156 probes) ≤300; 11.99e9 ops ≤20e9; 211968 ticks; 5.09M slots; per-row wall/CPU held |
| G5 triage | ✓ | full suite: 6 failures = shifted pristine baseline (234/368/386/387/511/512); fixtures 6/6 |

## Execution record (single authorized attempt + 1 crash-resume)

- Bank `evidence/mgate-d/fresh-01/` (deterministic 382001–382036, union-excluded;
  fixture written post-build per V1c ordering note). No prior use (asserted).
- First invocation: 30 mains (gen1 24 + tau-null/382001 6), then crashed on the
  first battery — null-config restore bug (V1d). Zero rows lost (nothing
  checkpointed past gen1's 24). 6 phantom mains (crashed process, unledgered).
- Resume (V1d, same bank SHA): completed 72 mains + 156 probes. `redone` lists
  12 resume-processed rows (1 true recompute: 382001:tau-null; 11 first-runs).
  Ledger closes EXACTLY at 96/156 (no double count). Dual provenance in
  `dev-results.json` (executionSources=start, scoringSources=fixed).
- Cumulative: 6868 + 252 ledgered (+6 phantom disclosed) = **7120**.

## Findings (all preserved, none spent further)

1. **Margins are decision-relevant (G1 PASS).** Top-tercile margin decisions hit
   target==1 at 74% vs 43% bottom-tercile. The D1 readback measures something
   real. This positive stands independent of the intervention verdict.
2. **Certainty-gating changes nothing (τ-0.2 ≡ τ-0 bit-identical).** All
   tau-0.2 anchors/rows/probe-values are bit-identical to tau-0: the gate
   never closed once in-bank — the V3 pull sharpens margins above 0.2, so a
   0.2-certainty gate is uniform in practice. Selective protection was never
   actually tested; uniform protection was re-tested and re-failed (dA −0.25).
3. **Billing asymmetry confounds embodied comparison (chaos, history-dependent).**
   382001: same deaths, same choose-draws, gate never applied — yet weights
   diverged 0.41 (retention/replay streams shifted). 382010/19/28: same
   conditions, drift only ~5e-6. Lesson for any future gated line: gate must
   bill symmetrically (e.g., always-bill-both-paths) or comparisons confound.
4. **V3 re-confirmed null/harmful under a new gate.** Consistent with V3
   DEV-NOGO and M-ACTOR harm: directional pulls do not protect retention.

## Route cause (execution environment anomaly, disclosed, zero impact on verdict)

Three foreign stock-V3 re-runs (72+156 exec each, DEV-NOGO verdicts) appeared
inside this study's bank/output paths (21:16, 21:24, 21:30), one per M-GATE
run command; CLI-path `node scripts/margin-gated-dev.mjs --bank/--output`
executed `body-transfer-dev.mjs` instead (proven by stack traces). M-GATE's own
bank asserts blocked every collision (zero M-GATE worlds lost or duplicated);
foreign artifacts (2 runs, 81 files each, sha256-manifested) quarantined
untouched to `margin-gated-dev/quarantine-20261028/` + `mgate-d/quarantine-20261028/`;
M-GATE executed on isolated paths via module import. Mechanism unknown —
reported as-is; no M-GATE evidence affected (git status clean throughout).
