# NONLINEAR STEERING HEAD — DESIGN V1 (candidate B, NOT AUTHORIZED)

Date: 2026-11-02. Zero worlds. Status: DESIGN ONLY — no license,
no bank, no code, no fixtures, no execution. Promoted by round-4
NO-GO (frozen falsifier: ARCHITECTURE, not signal). This doc scopes
the design space; a frozen dev plan comes only after the design
settles, then implementation, then fixtures, then one execution.

## Requirement (from the R4 falsifier)

The linear 2×D head cannot express the guard's viability gate:
guarded wins 5/8 while every learned variant (environmental,
rehearsed, guard-informed, behavior-cloned) loses to it by
~0.55. The new head must be able to represent a viability-gated
branch structure (go-iff-viable) while remaining billable,
checkpointable, freezable, resettable, and probe-compatible
(fork copies `state.steering.weights` — any new params must live
there with matching choose/validate/update).

## Candidate architectures

### B1 — Gated pair (recommended default)
Two 2×10 linear heads: `go` branch and `stop` branch, selected by
`guard.viable` (hard switch, computed — not learned — from the
same `overlapGuard`). When viable: action = argmax(go·phi); else
action = 0 (stop) with no learning update (acquisition-gated by
the same flag). Billing: values 2×(2·2·10) worst case + update
on the active branch only (same per-op rate). This is the guard
policy *internalized* as architecture rather than imitated as
behavior (R4) or informed as input (R3). Falsifier carries over:
if B1 still loses to guarded, the gap is not even branch
structure — candidate B as a family closes.

### B2 — Threshold units
Single head with learned thresholds on the viability scalar
(soft gate: sigmoid(k·(margin−θ))). More expressive than B1,
less interpretable, harder billing (exp ops). Fallback if B1's
hard switch proves too rigid in scoping.

### B3 — Small MLP (2-layer, ≤16 hidden units)
Most expressive, least interpretable, biggest instrument change
(caps on hidden size frozen at plan time). Last resort — licensed
only if B1 AND B2 both close with the gap intact.

## Addendum A1 (2026-11-02, zero worlds — supersedes the B3 sketch above)

R779 (Li et al. 2025, tiny RNNs): 1–4 unit recurrent networks match
larger nets on reward-learning tasks and are interpreted via dynamical
systems. B3 is therefore refined from "small MLP" to TINY RECURRENT
HEAD (1–4 units, recurrence over the feature stream, dynamics-
interpretable): expressiveness from recurrence, not width; billable
size; the viability-gated strategy linear heads cannot express is a
dynamical object (state-dependent switching), which is exactly what
recurrence represents natively. The MLP sketch is retained above as
the superseded record, not deleted. B3 still needs its fresh rationale
and remains queued behind its own gate (no B3 on gating grounds —
R6 falsifier stands); this addendum sharpens WHAT B3 would be, not
WHETHER it runs.

## Addendum A2 (2026-11-02, zero worlds — slow-integration constraint)

R780 (Wong-Lin 2006, recurrent time integration): slow evidence
accumulation needs slow reverberation (NMDA-mediated); fast-only
recurrence decides too fast to match behavior. Constraint on the
refined B3: the recurrent head must carry a SLOW integration trace
(eligibility-like, holding viability history across ticks) — mere
recurrence is insufficient, and fast-only recurrence is pre-falsified
by this result. A B3 freeze must name its slow variable and its
timescale, or it is not a B3.

## Addendum A3 (2026-11-02, zero worlds — silence constraint)

R781 (Shindou 2018, silent eligibility trace): the trace accrues
silently (activity-initiated, LTD-masked) and expresses only when
dopamine converts it. Constraint upgrade from slow to SILENT: the
B3 slow variable must accrue WITHOUT ACTING — no behavioral
signature until the gate reads it. This answers B2's poisoning at
the mechanism level (the stop branch acted while learning and
dragged the shared trajectory down). A B3 freeze must show the
trace is behaviorally silent during formation, or it is B2 with
extra steps.

## Addendum A4 (2026-11-02, zero worlds — divide components, not choice)

R782 (Verharen 2019, D1/D2 title record): the go/no-go pathways own
different component processes of the decision, not the same choice
twice. Rule for any future mixture: divide the components (go owns
pursuit, stop owns the restraint threshold) instead of duplicating
the argmax across branches. B1/B2 failed both branches at the same
decision point; biology splits the decision itself. A mixture freeze
that cannot name its component division is not a mixture.

## Addendum A5 (2026-11-02, zero worlds — separate consequence matrices)

R784 (Bogacz 2017, motivation theory): striatal Go and No-Go weights
learn SEPARATELY about positive vs negative consequences, with the
motivational state scaling the positive term. The division is in the
LEARNING (different matrices, different consequence classes), not
just the action. A mixture freeze must therefore name not only who
owns which component, but which consequence class each matrix learns
— and the motivational scaling of the positive term is the
acquisition-gating gain function in its native form.

Extension (R785 — Lowet 2025, opponent distributional title record):
the 97%-negative landscape is a distribution (dense small losses,
rare gains), and opponent halves natively encode halves of a
distribution. The separate matrices gain a third voice alongside
consequence classes and Go/No-Go pathways: halves learning halves
of the reward distribution. The effort term is pharmacologically
grounded too (R785 — Bardgett 2009, D1/D2 antagonists discount
effort, agonists restore): gain AND cost are both dials.

## Addendum A6 (2026-11-02, zero worlds — transmodulatory suppression)

R786 (Matamales 2020): D2-SPNs suppress outdated D1 plasticity to
reshape volition — extinction's circuit operation, necessary not
optional. The wire B1/B2 lacked, named: stop activity must INHIBIT
go-plasticity (transmodulatory coupling), not merely act instead of
the go branch (B1) nor learn beside it (B2). A mixture freeze must
name its suppression pathway — which stop signal, which go trace,
what suppression operator — or it repeats the zero-coupling failure
with new weights.

Third process (R794 — Hashimotodani 2017, mossy-LTP title
record): the suppression pathway is itself PLASTIC — learn WHEN
to suppress. Go learns, stop learns, and the coupling learns:
three learning processes, all named, none built. A mixture freeze
that fixes its suppression schedule by hand builds two students
and a statue.

State selection (R798 — Bar-Ilan 2013, Segev): dendritic
inhibition SELECTS among protected / potentiated / depressed per
compartment, coexisting over short distances. The dendritic arm
is a three-state switch, never a blocker — and "protected"
(unchanged-by-design) is the silent trace under another name.
Two natures (R798 — Frola 2013): dendritic inhibition is
competition-shaped (plastic, activity-dependent); perisomatic is
NOT (fixed, structural). One learning brake + one fixed brake:
plasticity where inputs arrive, fixity where outputs leave.

Integration window (R800 — Rakela 2024): transplanted/new
components are not instant — integration takes its own
activity-gated period (expression windows, host-circuit
manifestation). A mixture with new components freezes an
integration window, never assumes instant coupling.

ISN by default (R800 — Sanzeni 2020): inhibition stabilization
is the widespread DEFAULT regime (paradoxical suppression
confirmed, no stimulus needed). Design for ISN by default —
paradoxical effects expected, not anomalous.

ISN framing (R799 — Hennequin 2013): inhibition-stabilized
networks selectively AMPLIFY — fixed soma stabilizes to ENABLE
dendritic selection. Stability is computation's condition, not
its enemy: hold still to select. Causal fractionation (R799 —
Tang 2014): both arms earn their place by intervention (SST
reopens plasticity against the PV-only story) — neither brake
arm epiphenomenal; correlation's fractionation becomes
causation's.

Brake form (R795 — Miehl 2022, nonlinear inhibitory plasticity):
inhibition must DOMINATE excitation and depend NONLINEARLY on
the postsynaptic rate (same-sign changes) — excitatory Hebbian
learning alone is unstable (runaway or silence), and linear
symmetric suppression is pre-falsified by stability theory, not
by opinion. The coupling specifies dominance + nonlinearity.

Instructive brake (R796 — Rossbroich 2025, E/I errors):
suppression MAGNITUDE encodes the local error instructing go
plasticity (targeted interneuron feedback → assembly-specific
errors). The brake INSTRUCTS, never merely gates: how much stop
inhibits go says what go must fix. Speed fusion (R796 — Wu 2026):
E/I balance facilitates meta-learning — the coupling IS the
adaptation-speed substrate. Suppression, instruction, and speed
share one mechanism.

Fractionation (R797 — Udakis 2020, PV-iLTD vs SST-iLTP):
perisomatic inhibition WEAKENS (release the output) while dendritic
inhibition STRENGTHENS (gate the inputs) — opposite plasticity by
compartment, synapse-specific gating. The coupling specifies
compartment + direction: release-soma, gate-dendrite. "Inhibit
go-plasticity" was a slogan; this is a circuit.

Extension (R787 — Goulton 2026, early-uncertainty gating):
suppression is transiently EARLY (recruited when contingencies
emerge, not steady-state), TARGETED at the plasticity gate (PKA
constraint in the go pathway), and OVERRIDES the global broadcast
signal. The freeze names timing (early, uncertainty-gated) +
target (the plasticity gate, never the weights) + override
(against the broadcast teaching signal) — all four coordinates
now specified by independent results.

## Addendum A7 (2026-11-02, zero worlds — phasic stop, epistemic explore)

R787 (Huang 2023, CIN burst-pause; Friston 2016, active inference):
two head-behavior rules. (1) Stop is PHASIC: burst-then-pause with
an obligatory recovery window for updating — tonic stop holds the
system down, phasic stop lets it rewrite (B1 held down, B2 never
released). (2) Exploration is EPISTEMIC: ambiguity-resolving
before reward-seeking — the 10% ε-greedy belief-free noise in all
three heads is the unprincipled placeholder this replaces; a freeze
names its uncertainty signal and its epistemic policy, or it keeps
the noise and says so.

Extension (R788 — Nikolov 2018 IDS; Dreyer 2010 receptor model):
the epistemic half gains its tractable method — information ratio
over the distributional encoder, built for heteroscedastic
landscapes (the 97%-negative case by name), never ε-noise. The
phasic half gains receptor mechanics (parameter-free): bursts
drive D1 occupancy, pauses drop D1+D2, phasic means D1-up/D2-down
vs tonic — tonic-stop is D2-tone hold, phasic-stop is burst
(D1 learn-window) + pause (D2 release) = rewrite window. Stop
forms read as occupancies now, not metaphors.

Extension (R789 — Aosaki 2010, balance update): the cycle is
burst-pause-REBOUND, three phases — dopamine surging into the ACh
vacancy, then the structured return. The release has structure
too: a phasic-stop freeze names all three phases (inhibit, hold
vacant, rebound), never two.

## Constraints (all candidates)

- Features stay the R3 10-dim set (guard channels included —
  B internalizes what R3 merely observed).
- Fixed curriculum (round-1 table): single-variable vs R1-learned
  is lost (architecture differs), so the comparator set must
  include R3-learned-guard too (input-only) to separate
  architecture from information cleanly.
- Frozen/reset/transfer probes unchanged (weights live in
  `state.steering.weights`; fork/validate/freeze/reset generalized
  by shape, not dim — same pattern as the R3 dim parameterization).
- Billing: 1 scalar op per op, honestly counted; caps from
  R3/R4 actuals × margin at freeze time.

## Open questions (close before any freeze)

1. B1 vs B2 vs B3 selection (default B1; B2/B3 need a reason).
2. Learning rule for the gated branches (per-branch delta rule
   mirroring the live update? frozen form TBD).
3. Acquisition gating semantics (no update when stopped — does
   the stopped branch starve? pre-register the answer).
4. Verdict mapping (transfer gate + retentions + beat-guarded?
   B1 internalizes the guard, so beat-guarded returns as the bar —
   frozen at plan time).

## What this is not

Not a plan (no frozen numbers), not licensed, not scoped for
execution. The next artifact is a scoping doc once the design
settles, following the R2/R3 pattern.
