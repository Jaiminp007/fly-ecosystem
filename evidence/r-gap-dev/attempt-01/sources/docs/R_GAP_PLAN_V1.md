# R-GAP plan V1 (gap-widening recursive search, Phase A)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-A attempt (≤8 proposals, ≤96 worlds). Parent: M-DISCRIMINATE
(gate OPEN, 10 contexts, transfer 0.0); V1a/S-GATE/M-GATE reconciliation;
RSI synthesis V2 CLOSED (menu exhausted — this plan searches NEW ground only).

## Search spaces (charter satisfied: 3 new, 1 contradicts a prior)

Menu = classes NEVER searched for gap fitness (verified read-only 2026-10-28
against all 29 idea-classes + file-level option census):
- **S1 motor-representation** (untouched in 0 search files; the feature space
  itself: shared vs ecology vs alternatives; body-relevant without
  re-litigating E3's shift-vs-reorder question — that was about effect
  PATTERNS, this is about trainability).
- **S2 acquisition scheduling** (timing, not volume: phase-gated plasticity
  windows, surprise-keyed learning on/off, renewal scheduling; V1's
  turn-before-translate was one instance, never a space).
- **S3 critic-side asymmetry** (criticWarmStart untouched; actor-vs-critic
  rates/advantage handling) — CONTRADICTS the program's motor/actor prior
  (H1m, M-GATE margins, all actor-side): it bets the critic matters more.
Old classes (incl. dead margin/surprise/volume families) are EXCLUDED unless a
written arena-specific reason is frozen via amendment BEFORE use — none
offered here. Hard bans stand (pulls/anchors, certainty-gating, volume,
alignment, E3-rescoring, verdict-rescoring).

## Anti-degeneracy (verified, non-negotiable)

Zeroed control (`resetTasteEnergyBody`) is immutable — fitness counts ONLY
trained-side movement. Symmetric billing across ALL arms is mandatory
(S-GATE construction; M-GATE asymmetry wobbled the control ~1.0, S-GATE holds
it bit-exact 0.0000). Transfer-gap guard: |transfer gap − control| ≤ 0.1 or
the run is INVALID (billing confound), no verdict.

## Bank + grid (fresh, union-excluded)

- Phase-A dev bank `evidence/r-gap-dev/fresh-01/`: deterministic 387001–387054
  (6 histories × 9), `fixture-seeds-01.json` post-build (V1c ordering lesson);
  union-excludes all prior banks, fixture ranges, test tokens.
- ≤8 proposals TOTAL across S1–S3 (each a complete config: mains for anchor +
  A/B probe batteries + transfer guard battery); control = null/baseline
  config (Gen1-equivalent). Cumulative ledger (search + scoring all in).
- Each proposal: 4-history mains? NO — proposals share the 6-history bank;
  per-proposal mains (6 arm-candidate-equivalents for anchors) + 52-probe
  battery; exact layout in the dev script, total ≤96 worlds.

## Conjunctive Phase-A bars (all must pass → GO; any fail → line CLOSED)

- G1 improvement: best-proposal mean |d| (A/B families pooled, per-history
  means) − control mean |d| ≥ +0.5 (calibrated: spent mean 1.265, sd 0.72,
  max 3.01 — +0.5 is 0.7σ, a real effect not bank noise).
- G2 transfer guard: |transfer gap − control transfer gap| ≤ 0.1 per history
  (else INVALID per anti-degeneracy, not merely NOGO).
- G3 caps: ≤96 worlds this phase, ≤20e9 ops, ≤3600s wall, ≤200MB.
- G4 baseline sanity: control-arm mean |d| within [0.5, 2.5] (spent scale
  mean 1.265, sd 0.72) — if the fresh bank's control gap is off-scale, the
  bank is non-comparable (cf. v23 dead-substrate precedent) → INVALID,
  do not judge proposals against a broken ruler.
- G5 triage: full suite green (6 shifted-pristine only) + fixtures for the
  scorer + bank build/smoke BEFORE any world.

## Not included (unchanged)

No qual/reserve contact; no bank reuse/regeneration; no rescoring of prior
verdicts (spent numbers are FROZEN INPUTS for calibration, never re-judged);
no second Phase-A attempt (crash-resume only under V1d terms). Phase B
(second generation from winner + copy-control + matched budget, RSI
succession rules) ONLY on Phase-A GO, via frozen V1a. RSI claim ONLY on the
original gate (≥2 successive fresh-eval accepts + productivity vs
copied-improvement + total budget). Phase-A GO is a search hit.
