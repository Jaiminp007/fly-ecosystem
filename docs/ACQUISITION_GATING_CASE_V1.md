# ACQUISITION GATING CASE V1 (candidate, unlicensed — zero worlds)

Date: 2026-11-02. Status: CASE SPECIFIED, not scoped, not frozen.
Source: R783 (van Swieten & Bogacz 2020 — motivation scales both
choice AND plasticity; formal framework, first of its kind).

## The untested axis

Every gate in the program modulates CHOICE (act/stop, go/no-go).
None modulates the LEARNING RATE by motivational state. The
candidate class: acquisition-gating — plasticity gain as a function
of hunger (desired-minus-current resource): learn fast when hungry
(high need = high value of information), consolidate when sated
(low need = protect what holds). This is distinct from:
- threshold-tuning (Wu S6K, R782 — acts on ACTION threshold);
- viability-gating (R3–R6 — acts on action SELECTION).
Those gate what the learner DOES; this gates how fast the learner
CHANGES.

## Frozen-form candidate (R784 — Bogacz 2017)

Utility = hunger-scaled positive consequences minus effort. The
gain function takes this form: multiply the positive (reward) term
by the hunger scalar, leave the effort/discount terms unscaled,
with hard bounds so gain cannot explode the weights. The ceiling
of the class (not its entry): meta-plasticity — the gain itself
as a learned parameter, after dopamine neurons that learn their
own activity level. Architecture rule (R785 — Ben-Iwhiwhu 2022,
modular neuromodulation): gain lives in its OWN module beside the
actor, never entangled in the policy weights. A scoping starts at
the fixed-gain form and must earn the learned-gain form. Earner named (R796 — Li 2017,
Meta-SGD): meta-learn initialization + update direction + learning
rate jointly (higher capacity than MAML, one step, supervised +
RL). "Must be earned" now names the earner — a scoping earns the
learned-gain form by specifying its meta-learner, never by
asserting it. Scale upgrade (R797 — Wichrowska 2017): meta-learn
the OPTIMIZER (hierarchical RNN, minimal overhead, structure-
mirroring), generalizing to unseen architectures — not one gain
per task but the update rule itself. The earner earns at scale.

## Timing rule (R786 — Scheller 2026, sniffing shapes dopamine)

The sampling rhythm entrains the teaching signal and assigns
distributional roles (optimism-pessimism by phase). The body CLOCKS
learning: a scoping must lock update timing to the action cycle
(update on the post-decision phase, not on an arbitrary tick) and
state whether distributional roles are phase-assigned. Action,
sensing, and teaching are one loop — a design that updates off-cycle
treats them as three modules and repeats the decoupling.

Ordering upgrade (R788 — Jang 2026, ACh demixes dopamine): the
update must LAG the pause — lagging predicts learning, preceding
predicts nothing, coinciding drives movement. Post-decision timing
upgraded to pause-then-teach sequencing: a freeze that updates
before the pause resolves is pre-falsified.

## What a case needs (not a plan)

A future scoping must name: the gain function (frozen formula of
the hunger scalar → plasticity multiplier, with bounds so gain
cannot explode the weights), the billing (gain application cost),
and the falsifier (no transfer lift vs the ungated twin at matched
budgets = close; lift without retention = the retention⇏transfer
dissociation again, close with cause). Until then this is a
specified case, not a queue entry.
