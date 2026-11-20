# RSI-SELF results — Phase A GO (in-agent loop runs honestly, causes no harm)

Frozen: `docs/RSI_SELF_PLAN_V1.md` + `V1A.md`. Single authorized attempt:
8 mains (selfmod/fixed × 4 histories, fresh bank 396001–396036), 0 probes.
No crashes, no resume (`redone: []`).

## Verdict: PHASE-A-GO (conjunctive, all bars pass as frozen)

- G1 integrity: 8/8 mains complete; ledger exact (8/0/14336/344064/1.35e9);
  all 12 expected checkpoint records present with all 8 fields. `tick:512`
  records show n=24, `tick:1536` n=16–19 (late-run deaths are normal
  ecology, shared across arms).
- G2 auditability: every logged decision == mechanical rule recomputation
  (adopt ⟺ candErr < incErr×0.99; zero skips to validate the skip branch
  live — the skip path is covered by fixtures). The loop evaluated honestly:
  no decision deviates from its own logged numbers.
- G3 safety: mean level gap selfmod−fixed = **+0.054** (tolerance ≥ −0.15).
  The loop does not harm; the positive sign is DESCRIPTIVE ONLY —
  pre-registered, no improvement is claimed from Phase A.
- G4 liveness: 8 ADOPT-checkpoints + 12 KEEP-checkpoints, 0 skips. Both
  branches exercised live; the loop is not vacuous. Texture: all four
  tick-512 checkpoints kept unanimously (first-checkpoint conservative
  ×0.5 default loses to the incumbent on the eval window — sensible),
  adopts concentrate at 1024/1536 as training curves wiggle.

## What this decides (and what it does not)

DEMONSTRATED, on a fresh bank, with a frozen mechanism: an agent can carry
a propose→evaluate→adopt loop inside its own run, on its own state, billed
to its own meter — proposing from its own error trajectory, evaluating
symmetrically on held-out records, adopting conservatively, logging
everything auditably. This is the VISION mechanism existing, not merely
described. First line in the program where the "self" in self-modification
refers to the running agent rather than an outer script.

NOT claimed: no improvement (Phase A cannot claim one by design); no RSI
(the bounded-RSi requirements — successive accepts, copied-improvement
control, total budget — are untouched). The +0.054 gap is noise-scale
descriptive texture, not an effect.

## Licensed next step (proposed, not started)

V1b: run the loop where a real signal exists AND count accepts — e.g.,
selfmod agents in the turn arena, or a richer menu (rate + surpriseGain +
threshold), with the copied-improvement control the RSI definition demands.
Requires its own frozen plan + fresh bank + fresh goal. Nothing is executed
here.

## Cumulative: 7439 + 8 = 7447 (all ledgered, zero duplicates)
