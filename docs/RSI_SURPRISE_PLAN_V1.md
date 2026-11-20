# RSI-SURPRISE PLAN V1 (FROZEN 2026-11-03 — single authorized bounded run)

## Question
Does a self-proposed surprise-rehearsal change transfer better than
fixed-rate learning and unlearned control, under V1's independent
transfer eval?

## Why this change (genuinely new rationale, not a variation)
- V1b's lesson is SELECTION, not amplification: picking WHAT to rehearse
  matters, not how much to learn. Surprise-gating (boost rehearsal of
  high-error records) is selection over records — the untested half of
  that lesson. V1b tested {rate, shrink, skip, gain} internally (5 accepts,
  NOGO); C14 closed sparse externally (NOGO-flat, channel closed); V1-reset
  voided (taste-reset never adopted 0/133; actor/critic provably
  sandbox-invisible). SurpriseGain was never proposed, adopted, or scored
  anywhere (internal or external, train or transfer).
- Mechanism story: surprising records mark phase boundaries and rare
  skills; prioritizing them protects exactly the durable knowledge that
  backward-retention (V1/V1b GO) shows persists — and that recency-only
  replay lets erode. This is the first scoring of surprise-selection.
- It is NOT a rate dial (conditional record selection, not step size), NOT
  a freeze (learning continues), NOT a reset (no zeroing), NOT a menu
  variation of a scored line (the item itself is unscored).

## Design (minimal delta from V1a — same selector, different change)
- Sandbox UNCHANGED from V1a: per agent, at checkpoints {512,1024,1536},
  store=[...older,...recent]; skip if <16; fit=last 32 before test;
  test=newest 8; err=test MSE after fit-replay on clones (taste-only,
  V1-reset finding). Bar unchanged: adopt iff best < inc×0.99.
- Proposal family (the ONLY novelty): surpriseGain ∈ {0, 1.0, 3.0}
  (off/moderate/strong; 3.0 mirrors V1h's sustained scale). Candidates =
  values ≠ current. Reversible across checkpoints (config-carried state,
  no driver Map). One decision per agent per checkpoint max.
- Pre-init (all arms, symmetric, inert for controls): surpriseEma=0,
  surpriseTimer=0 at creation — required because gain-0-created learners
  lack these fields and live enabling would NaN-poison the EMA
  (`taste-energy.mjs:176-180`; branch guarded by gain>0 so controls
  identical in behavior).
- Fee (symmetric, documented scaling): (1+nCand)×(fitN+testN)×(D+1),
  nCand≤2 (V1a billed flat 2× for 2 configs; same rule, variable count).
- Train arms: selfmod (proposes) / fixed (gain 0 always) / unlearned.
  2 pairs × (3 trains + 3 transfer probes) = 12 mains, 0 probes.
- Transfer (V1 exact): same-codebook paired histories, full-body
  transplant with digests, probe at DEFAULT config (surpriseGain 0 — V1a
  precedent: do not carry config, isolate weight effects), probe learns
  normally. Endpoint = budgetAdjustedEnergyPerFounder.
- Verdict: GO (`RSI-SURPRISE-GO-V1`) iff mean(selfmod) > mean(fixed) AND >
  mean(unlearned). Else NOGO (`RSI-SURPRISE-NOGO-V1`). Zero adopts →
  `INCOMPLETE-NOADOPT` (void, V1-reset precedent — no contrast scored).
  No RSI/retention/population claim regardless (single thin line).
- Bank: fresh-05, 474001–474036 (4 histories × 9, 36 unique), minted
  post-fixtures, verified clean. Caps: BT ticks/caps (unchanged).
  Single attempt. Disk floor 1 GB (stop run if below).

## Pre-registered risks
- Surprise may rarely/never beat recency-fit on newest-test (same trap as
  V1-reset) → void. Both outcomes informative (void = surprise never helps
  prediction by this probe; NOGO = helps prediction but not transfer).
