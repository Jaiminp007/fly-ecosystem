# RSI C1 PLAN V1 (internal operator loop) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: completion-plan Track C + `docs/RSI_INTERNAL_LOOP_SCOPING_V1.md`
(B-first recommendation) + migration-study machinery (retained factual
experiences) + RSI-SELF ledger (weight-revisions fail; operators untried
from inside). This is C1 (design + implement + loop-integrity, ZERO
worlds); C2 (execution with verdict) is a separate future freeze.

## What C1 builds (capability, not product)

An agent-internal loop: the controller PROPOSES operator revisions from
a pre-registered menu, EVALUATES each by sandbox replay on its own
retained experiences, ADOPTS iff sandboxed improvement ≥ bar (then
live-validates on fresh tasks in C2). Capability success = the loop runs
bounded, checkpointed, and honest — even if it accepts nothing
(M3 capability/product split applied inward). Product (accepted
revisions) is C2's question, gated by the original RSI bars (≥2
successive live accepts + productivity vs copied-improvement; unmoved).

## Proposal language (menu-only, ≤6, pre-registered)

Operators the agent may propose (its learning-system settings, not
weight values — RSI-SELF tried weights and self==static):
1. `replayGain` ∈ {0.5, 1.0, 2.0} (replay amplification level).
2. `replaySkip` ∈ {0.05, 0.1} (skip low-error records).
3. `shrinkOnce` α ∈ {0.5, 0.25} (one-shot lossy shrink, then resume).
4. (reserved; menu closes at 6 — any 7th needs its own frozen amendment).

Scale-free step rule (RSI-SELF V1c precedent): propose from menu only,
never invented values; at most one proposal per phase boundary.

## Sandbox semantics (retained-experience cross-validation)

- Retained set: the agent's own `recent` + `older` buffers (≤32 records,
  factual (phi,target,experience) — migration-study rule: replay only
  retained own experience, never generated counterfactuals).
- Split: proposing experience (fit) vs held-out experience (test),
  disjoint by experience id (anti-sandbagging: the proposal cannot be
  evaluated on the records that suggested it).
- Clone math: clone weights, apply proposed operator through the
  retained fit set (same billing as live: `tasteUpdate` replay path +
  kernel/budget formulas where applicable), measure held-out squared
  error vs current-weights baseline on the SAME held-out set.
- Adopt-into-sandbox iff `candErr < incErr × 0.95` (5% bar,
  RSI-SELF V1c faithful-mix form). Sandbox ADOPTION ≠ live adoption
  (live validation is C2, on fresh banks, with copy-control).

## Budgeting (whose ops)

All sandbox math bills to the agent's own `work.scalarOperations`
(same wrappers/formulas as live; symmetric on every arm). Flat fee per
proposal evaluated: `2 × (fitN + testN) × (D+1)` (V1c form). Proposals
per lifetime capped (pre-register: ≤4) — boundedness is a loop-integrity
assertion, not a suggestion.

## Checkpointing (M3 inward)

Pre-proposal checkpoint (weights + buffers + RNG states, canonical);
post-evaluation restore-or-keep exactly (adopted sandbox state OR byte-
identical restore — verified by digest, fixture-tested). No partial
application (all-or-nothing per proposal; V1l lesson).

## C1 loop-integrity fixtures (pre-registered, gate before code runs)

Module (6): menu-closedness (7th proposal throws); fit/test disjointness;
clone isolation (live weights untouched by sandbox); billing exactness
(flat fee + per-op); checkpoint byte-identity on reject; adoption-bar
math (0.95 factor both branches). Instrument (4): honest self-assessment
(sandbox ranking matches live ranking on a calibration triple, else
INVALID-LOOP); boundedness (5th proposal refused); triage null-hygiene;
sources-closure. Total 10. Zero worlds (synthetic states/records only).

## What C1 does NOT do (explicitly out of scope)

- No live adoption (no weight/operator changes persist outside sandbox
  except via C2's frozen execution). C1 cannot change behavior — only
  propose, sandbox-evaluate, and report.
- No fresh banks, no attempts, no worlds (C1 is code + fixtures + triage).
- No claim (capability ≠ product; C2 gates: ≥2 successive live accepts
  + productivity vs copied-improvement + matched/total budgets).

## Status

FROZEN DESIGN (zero worlds). Next: implement C1 (code + 10 fixtures +
triage), then freeze C2 (execution: dev bank + single attempt + verdict).
No RSI claimed (loop unbuilt; bars unmoved).
