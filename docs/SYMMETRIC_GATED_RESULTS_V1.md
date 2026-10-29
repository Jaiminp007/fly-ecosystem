# S-GATE results — Phase-D single attempt (CLOSED DEV-NOGO)

Frozen plan: `docs/SYMMETRIC_GATED_PLAN_V1.md` + V1a. Verdict: **DEV-NOGO —
line CLOSED**. No Phase Q. No qual spent. All negatives preserved below.

## Verdict table (conjunctive; any fail closes)

| Bar | Result | Detail |
|---|---|---|
| G1 relevance | ✓ GO | n=37758, bad=0; cut1 0.101, cut2 0.206; loRate 0.451, hiRate 0.717, **gap 0.265 ≥ 0.10** |
| G2 effect | ✗ NOGO | bestTau=0 (tau-0.3 identical on retention): dA **+1.2e-6** (bar ≥+0.15), dB +1.2e-6 ✓, dL +0.011 ✓, alignUp ✓ |
| G3 non-degeneracy | ✓ GO | τ-0.3 anchors differ from τ-null AND from τ-0 on all 4 histories (gate opened AND closed in-bank; threshold bites) |
| G4 caps | ✓ | 228 exec (72 mains + 156 probes) ≤300; 9.74e9 ops ≤20e9; 168960 ticks; 4.05M slots; per-row wall/CPU held |
| G5 triage | ✓ | fixtures 4/4 symmetric + 7/7 margin + 6/6 anchor green pre-execution; full suite = 6 shifted-pristine failures only (instrument frozen since) |

## Execution record (single attempt + 1 scoring-resume, V1a)

- Bank `evidence/symmetric-gated-dev/fresh-01/` (deterministic 383001–383036,
  union-excluded; fixture written post-build per V1c ordering). No prior use.
- First invocation ran all 228 worlds cleanly, then crashed in scoring on a
  script keying bug (`W` built by tag strings, read by tau values — zero
  worlds affected, nothing written past rows/anchors/ledger).
- Resume under V1a skipped all 12 rows (complete on disk, `redone: []`) and
  completed scoring only. Ledger closes EXACTLY at 72/156 (no double count).
  Dual provenance in `dev-results.json` (executionSources=start,
  scoringSources=fixed).
- Cumulative: 7120 + 228 = **7348** (+6 M-GATE phantom disclosed earlier).

## Findings (all preserved; the line's question is answered, not deferred)

1. **Symmetric billing eliminates the chaos confound (design confirmed).**
   Null-vs-gated retention drift is ~1e-6 (vs M-GATE's 0.41 divergence under
   asymmetric billing) with identical deaths/draws. Computing always +
   masking the apply keeps comparisons fair — the mechanism works as designed.
2. **The V3 pull is null on retention even when fairly compared (effect
   failed).** Best gated arm differs from control by dA≈1e-6; selective
   (τ-0.3) ≡ uniform (τ-0) on every retention aggregate. With chaos removed,
   what remains is a true null: directional protection does not retain.
3. **The threshold bites but buys nothing (G3 GO + G2 NOGO).** Gate opened
   AND closed on all 4 histories — selective protection was genuinely tested
   this time (unlike M-GATE's never-closing 0.2), and still null. τ-0.3
   preserves control-like alignment (0.6999) while τ-0 raises it (0.7113) —
   the V3 direction effect reproduced, again without retention benefit.
4. **M-GATE's open questions closed:** (a) yes, the comparison was confounded
   (symmetry collapses drift 0.41→1e-6); (b) no, gating does not rescue the
   pull. The taste-anchor family (V3 uniform, M-ACTOR motor, M-GATE asymmetric,
   S-GATE symmetric) is now exhausted on mechanism, not just on luck.

## Route note

No foreign-artifact contact this run (pre-built bank + module-import
invocation; git status clean throughout). The CLI-path anomaly from M-GATE
did not recur.
