# M-GATE plan amendment V1a (pre-execution clarification)

Frozen 2026-10-28. Amends `docs/MARGIN_GATED_PLAN_V1.md` ONLY as below;
everything else (hypothesis, instrument formula, bank, grid τ ∈ {∞,0,0.2},
G1/G2/G4/G5, caps, single attempt, non-inclusions) stands. Frozen BEFORE any
M-GATE implementation run or dev-bank world. Reason: as written, G3's
"per-decision op-count variance across arms == 0" is unsatisfiable even for a
null run — anchor application is state-dependent BY DESIGN (the treatment),
and per-decision ops already vary in Gen1 (surprise/eviction paths). A bar
that fails a null run is a vacuous clause (V1/V2/V3 lesson); this amendment
replaces it with the D1-proven billed-equality form, which captures the same
intent (uniform margin billing; no state-dependent divergence from the gate
machinery itself).

## Changes

1. **G3 fidelity** is replaced by G3′ (closed-gate neutrality, D1-G3 form):
   a fourth config — pure Gen1 (`slowAnchorStrength=0`,
   `marginGateTau=Infinity`; gate code unreachable, outer condition false) —
   runs the same 36 fresh mains. For each history, τ=∞ post-main anchor vs
   Gen1 post-main anchor: learner `weights` + rng states
   (`feedRngState`, taste/motor rng) bit-identical; endpoint values satisfy
   |Δvalue + Δops×operationEnergy/founders| ≤ 1e-6 (gate billing only).
   Rationale: with the gate closed, the machinery must perturb nothing; the
   τ=0≡V3-uniform side holds by construction audit (gate true ∀ finite
   margins; unchanged pull code; no draws added).
2. **Totals**: 144 mains (4 configs × 36) + 156 probes (3 gated configs × 52;
   Gen1 arm needs no probes — nothing to retain) = **300 executions** (cap
   ≤300, satisfied exactly). Expected ticks ≈113.7k (ledgered; not a cap).
   Ops re-estimate ≈ +1.5–3e9 over the 264-exec plan, still ≤20e9 cap. All
   other caps unchanged and still enforced by the script.
3. Fixture G5 adds the in-process closed-gate check (strength=0 vs τ=∞ through
   `tasteUpdate`: weights deepEqual, Δops exactly 3/update) — supports G3′
   at zero worlds; G3′ proper is dev-bank.

## Explicitly not changed

No new worlds before this amendment (none run); no seed changes (bank still
382001–382036 + same union-exclusion); no tolerance changes to G1/G2/G4/G5;
no second attempt; no qual contact.
