# LEARNED ROUTER (B4) — CANDIDATE SCOPING V1 (NOT A ROUND, NOT FROZEN)

Date: 2026-11-02. Zero worlds. Status: CANDIDATE — the case for a
learned router over the fixed viability switch, recorded unlicensed
(R776). No bank, no code, no fixtures, no execution. This doc must
clear the genuine-novelty bar before any round-7 scoping begins.

## Mechanism sketch

Replace the computed viability switch with a learned router: linear
logits r = w·phi over the same 10-dim features, p = softmax(r),
action from the p-weighted branch blend (or sampled branch — frozen
later). Both branches update with router-weighted TD; the router
weights update by the same reward signal (move toward the branch
whose action preceded reward). Billing frozen at plan time (router
adds 2·D values + softmax + weighted updates — honest, small).

## Why this is genuinely new (not a gate variation)

B1/B2 routed on a COMPUTED channel (guard.viable — physics, not
learning). Nothing in the program has ever LEARNED a routing: the
router weights would be the first parameters whose job is selection
rather than action. New channel ⇒ new failure modes, named in
advance by the literature: routing fluctuation (StableMoE — same
input routed differently across training, sample efficiency dies)
and router collapse (always-go ⇒ reduces to R3-ish linear, no gain;
always-stop ⇒ B1 with extra steps). A B4 failure looks like
fluctuation or collapse — nothing like starvation (B1) or poisoning
(B2). Different mechanism, different signature, different falsifier.

## License-gate outcome (EXECUTED 2026-11-02, zero new worlds — CLOSED)

Offline logistic probe on spent acquisition traces (read-only):
267,739 (R5) + 267,608 (R6) decision→next-tick energy-sign pairs.
Base rates: P(+|viable)≈3.0%, P(+|!viable)≈0.7–0.9% — per-tick
energy deltas are ~97% negative (metabolic cost dominates; reward is
"lose slowly by default, occasionally gain" — itself a record of
why TD struggles here). Viability-only test-acc 0.9699/0.9710 vs
full-phi 0.9722/0.9719: edge +0.23pp/+0.09pp — the learnable mapping
is the constant predictor. A router trained on this signal routes
everything one way (entropy → 0), which is the falsifier's collapse
branch firing before any world is spent. Premise fails in the only
sense that matters (actionable routing signal beyond viability:
none). B4 CLOSED UNSPENT — the license gate working as designed.
The fixed switch already encodes everything learnable about
branch selection from these features.

Before any round-7 scoping, the core premise gets an offline test
on SPENT traces (R5/R6 rows, read-only, non-qualifying per the
spent-bank MEASUREMENT precedent): fit a linear router on the
recorded per-decision features to predict held-out reward-sign
better than the viability bit alone. If the router finds no signal
beyond viability (≤ viability-only prediction), B4 has no premise
and stays a candidate forever — the fixed switch already encodes
everything learnable, and the program learns that routing is not
the gap without spending a world. If it finds stable extra signal,
round-7 scoping opens with the stability metrics (entropy, churn)
as pre-registered gates.

## Falsifier sketch (for the eventual round, not frozen here)

- Router collapses (entropy → 0 on probes) → reduces to a linear
  head; close B4, no B5.
- Router fluctuates (same-context assignment churn across ticks,
  StableMoE's failure reproduced) → close B4, no B5.
- Router routes stably AND beats B2/guarded on transfer → qual
  consideration (iv-b).

## What this is not

Not a round (no number), not frozen, not authorized. B3 (MLP
expressiveness) stays queued behind its own fresh rationale
(Diffusion-QL direction, R777). The DTR trunk track proceeds
independently.
