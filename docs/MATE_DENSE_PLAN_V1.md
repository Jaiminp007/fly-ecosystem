# MATE-DENSE plan V1 — density unlocks mating (FROZEN)

Status: FROZEN 2026-10-26 (date convention: 2026-10-30). Single authorized
Phase-A attempt under its own plan. MATE-ACT V1 stands. No code, no bank,
no worlds yet. Further changes require V1a+.

## Why this line (licensed by V1 NOGO + encounter estimate)

MATE-ACT V1 proved the gate removal works and is behavior-neutral, but
produced 0 births: no qualified co-location in 8 mains. The encounter-rate
estimate (`docs/ENCOUNTER_ESTIMATE.md`, read-only) puts qualified encounters
at ≈0.05–0.15/main (≈60% chance of exactly 0 per line) and finds the spawn
setup anti-qualified (energy exactly 65.0 + age 0). The causally-next
question is density: encounters scale ~N² (pairs), so 24→72 founders gives
~9× qualified encounters (≈0.5 → ≈4 per line), crossing from "expected 0"
to "likely ≥1" IF the diffusion model is right. A null result is equally
informative (model wrong the other way → energy overlap, not proximity,
is binding → energy-ecology next, not more density).

## Design (minimal delta from V1)

- Arms (2): decoupled-24 (replication of V1 decoupled on a FRESH bank —
  required, banks vary; same gate removed) and decoupled-72 (density
  test). NO intact arm (channel-3 impossibility is proven mechanism, not
  an empirical claim needing re-control). The ONLY arm difference is
  founder count; gate, config, ecology, learner identical.
- Founder count via runner-level `reference` override
  (`{...VALUE_REFERENCE, founders:N}` — feasibility precedent ran
  founders-24/8 arms the same way). NO engine changes (flag + plumbing
  already frozen in). Capacity 240 default holds both.
- Fresh dev bank `evidence/mate-dense-dev/fresh-01/`: 4 histories ×
  9 slots = 36 seeds, range **403001–403036**. VERIFIED clean 2026-10-30
  (zero exact tokens repo-wide). Spend 8 mains (2 arms × 4 main-seeds);
  other 28 slots reserved-excluded, never spendable elsewhere.
- Caps: ≤300 exec (8 used), ≤20e9 ops (est ~3e9: 72-founder mains cost
  ~2–3× base), ≤3600s wall. Single attempt; crash-resume only with dual
  provenance; no second attempt under V1.

## GO bars (conjunctive, fail-closed; mechanism demo only)

- G1 integrity: 8/8 mains complete; ledger exact (8/0/14336 ticks;
  founderSlots reflect 24- vs 72-founder mains); `redone` empty;
  endpoints carry survivors + birth totals.
- G2 audit: per-row flag false on both arms; births integer ≥0;
  per-history birth records (if any) carry parentIds + generation.
- G3 existence: decoupled-72 total ≥1 OR decoupled-24 total ≥1 → GO
  ("density unlocks births HERE" — if the 24-arm does it, the estimate
  was conservative; unlock is unlock). Both zero → NOGO ("density
  insufficient at 3× headcount OR energy overlap binds — next is
  energy-ecology, not more density"). Arm split RECORDED always: 72-only
  success supports the density hypothesis; 24-only success means bank luck
  vs V1 (density effect unproven — follow-up must replicate before scaling
  claims); both succeeding is strongest (unlock + dose response).
- No INVALID branch beyond G1/G2 failure: no premise can break (both arms
  share the proven gate removal; either arm birthing is informative).
- G4 descriptive (no gate): per-arm levels, survivors, birth contexts
  (tick/energy/parents where applicable) for the follow-up.
- G5 fixtures (gate): 4 automated + triage — (1) scorer GO/NOGO/INVALID
  branches; (2) bank build + union-exclusion; (3) founder-count plumbing
  (72-founder construction on a fixture history, short run, no crash;
  survivors/energy sane); (4) null-behavior (flag-on 24-founder short run
  bit-identical to default construction); (5) full triage clean.
- Verdict GO ⟺ G1∧G2∧G3. No population claim (a birth ≠ lineage),
  no learning claim, no RSI claim. GO licenses proposing the inheritance
  follow-up (newborn parental weights + selection) + courtship
  (Option C) — fresh plans, never executing here.
