# CENSORING MEASUREMENT DEBT V1 (analytic, zero worlds)

Date: 2026-11-02. Source: R779 (Pan et al. 2026, CTPS — absence of
observed success in a time-limited episode is right-censoring, not
failure; progress estimates that ignore it bias).

## The debt

Every verdict gate in the program treats dead flies as zeros
(endpoint comparisons with survivors counted separately at best).
Deaths are right-censored trajectories: success unobserved because
observation ended, not because the policy failed. Gates that count
censored trajectories as failures bias against policies that keep
flies alive longer in hard regimes (they accumulate more exposure
to censoring) and bias toward policies that die fast with a few
early gains.

## The method (R780 upgrade — Goldberg & Kosorok 2012, censored Q-learning)

The debt graduates from complaint to bounded formalism: multistage
Q-learning with survival times as rewards, adjusted for censoring,
flexible stages, finite-sample generalization bounds, convergence to
optimal expected survival when the optimal Q-function is in the
approximation space. The first adopting line runs censored-Q on its
probes (new measurement, never a re-scoring) and reports whether any
closed margin changes shape — with bounds, not vibes.

## Fusion (R793 — Feng 2023, safety-constrained transfer)

The survival constraint and the transfer formalism unite:
constrained generalized policy improvement via Lagrangian, dual
optimization pricing the target task's safety. Transfer the policy
(successor recombination), constrain the dying (censored-Q),
price safety with a dual variable. Any future transfer line
adopts this union as its formalism — survival and transfer as
separate objectives with one priced tradeoff, never one metric
asked to do both jobs.

Rival (R794 — Yang 2020, PCPO): price safety (Lagrangian, soft
tradeoff) vs PROJECT onto the constraint set (hard per-update
reward-lower + violation-upper bounds, L2/KL convergence). A
future transfer freeze chooses between them with criteria —
projection for hard per-update guarantees, pricing for smooth
tradeoffs — never by default. The formalism debate is
pre-registered.

Third option (R795 — Chen 2021, PROF): differentiable projection
layer INSIDE the policy — feasibility by construction, gradients
flowing through (policy cognizant of constraints). Price-vs-project
dissolves: project hard, learn through it. The tiebreaker the
freeze adopts unless it argues otherwise.

Certificates (R796 — Tang 2026, LMI-Net): stability, robustness,
and invariance enforced by differentiable projection
(Douglas-Rachford + implicit differentiation, convergence
guaranteed). The safety side graduates from bounds to
certificates: a future line may demand proofs (LMIs by
construction) instead of promises (violation upper bounds).

Lineage + tooling (R797 — Amos 2017 OptNet; Blondel 2021):
constraints-as-layers with exact KKT gradients since 2017 (GPU
primal-dual, gradients ~free) — the approach outlives
architectures; bet on ideas that survive. And the machinery is
modular now (define F, autodiff the rest): certificate-layers as
composable parts awaiting the line that needs proofs.

Solver upgrade (R798 — Butler 2022, ADMM differentiable-QP,
title record): the certificate solves scale (ADMM vs
interior-point). The machinery improves while it waits — a line
that needs proofs cites the current solver, never the 2017 one
by default.

## Standing recommendation (not a re-scoring license)

No closed verdict is re-scored under this note (anti-shopping
stands — the gates were frozen and the outcomes hold as recorded).
For FUTURE probes: record per-tick survival alongside energy;
report restricted-mean (time-to-success / time-to-death) curves
per arm; treat death as censoring in the transfer comparison.
The first line that adopts this becomes the test of whether any
closed margin (e.g., B1/B2 transfer gaps, R4's −0.57) changes
shape under survival analysis — a new measurement, not a
re-interpretation.
