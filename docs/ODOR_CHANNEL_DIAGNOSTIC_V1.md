# ODOR CHANNEL DIAGNOSTIC SPEC V1 (re-analysis, zero new worlds)

Date: 2026-11-02. Status: SPECIFIED, not executed. Source: R789
(Mukherjee 2019 — NMDAR creates stimulus-specific memory, LTCC
maintains it; maintenance-without-specificity = generalization).

## Question

Which channel failed in R1/R3/R5/R6: the specific channel
(NMDAR-like — stimulus-specific memory never formed, so nothing
specific could transfer) or the general channel (LTCC-like —
specific memory formed but maintenance generalized it away)? The
six rounds' verdicts (transfer gaps + retention ratios) cannot
distinguish these; the distinction decides what any reopened odor
line must fix.

## Method (read-only, spent rows only)

Re-read the recorded transfer probes (5 modes) + A/B retention
rows from R1/R3/R5/R6 evidence: classify each arm's retained
behavior as specific (transfer-current ≈ transfer on trained
contexts only, sharp context tuning) vs generalized (flat transfer
across contexts, specificity lost). Reactivation probe (R790 —
Tayler 2011): test whether transfer contexts reactivate the
training ensemble's trace (probe-response similarity) —
reactivation failure is the specific form of general-channel
failure. Pairing rule (R800 — Moncada 2015, behavioral tagging):
persistence is SCHEDULED — weak tag + strong event nearby in time
or no capture. Check the schedule before judging the memory: no
strong event near the tag → no capture expected, verdict or not. Dominance ratio (R793 — Cui 2024, sufficient AND
necessary): measure the training ensemble's DOMINANCE in the
transfer context, not yes/no reactivation — tune dominance, tune
specificity; mossy suppression pairs with transmodulation as the
inhibitory counterpart. Context-overlap covariate (R792 — Doyle 2024): measure
encoding-stimulus overlap FIRST — gap-without-overlap is
encoding-coverage, never memory failure; the probe cannot judge
retrieval it never enabled. Interchange verification (R792 —
Geiger 2021): verify the encoder's abstraction by interchange
intervention (swap the representation, test the behavior), never
by correlation. No new probes, no new worlds, no re-scoring — a
diagnostic overlay, not a verdict change.

## Structural answer (R790 — Stooke 2020, ATC decoupling)

If the diagnostic finds entanglement (one head carrying both
channels), the specified refactor is separation, not another
gate: representation learned contrastively and frozen, policy
learned reward-driven on top. Multi-task encoders generalizing
downstream is the existence proof. This supersedes gating as the
default next operation — gate only what separation cannot divide.

Encoder specification (R791 — Liu 2021, return-based contrast):
the representation channel learns return-DISTRIBUTION structure
(aggregating similar-return state-action pairs = the abstraction),
the policy learns on top. This fuses decoupling with the
distributional voices and the 97%-negative landscape: abstract the
returns, then act. Any separation freeze names its contrastive
rule and its return-aggregation, or it separates nothing.

Plasticity proviso (R793 — CODA-Prompt 2023): freeze the encoder
ONLY after end-to-end decomposition training — frozen keys that
never learned to decompose cannot serve new tasks. Separation
needs its own learning phase; a separation freeze without one is
pre-falsified. Decomposition protocol (R794 — Kirsch 2018):
routing AND modules learned jointly end-to-end (no diversity
forcing), freeze after specialization turns interpretable. The
proviso satisfied constructively — the training half found, not
invented.

Discovery framing (R793 — Scholkopf 2021, CRL): the
return-distribution abstraction is a causal variable to DISCOVER
from low-level observations, never assume — and interchange
intervention is how discovery is verified. The diagnostic's
primary measure inherits the field's central problem.

TTC re-reading (R799 — Clopath 2008, tag-trigger-consolidate):
acquisition TAGS (silent mark), transfer TRIGGERS (capture
event), retention CONSOLIDATES (late stabilization) — one model's
three phases, not three literatures. The diagnostic's job is now
FIND THE TAGS: which traces were tagged but never triggered
(acquisition without transfer opportunity), which triggered
without tags (transfer probes with nothing to capture). Cross-
tagging explains mixed cases. Six gating rounds re-read as six
attempts at the trigger phase of a cycle the program never knew
it was in.

Meta-transfer re-reading (R795 — Bengio 2019): adaptation SPEED
to sparse shifts as the meta-objective — correct structure =
changes concentrated in few mechanisms = sparse gradients. Every
transfer gap re-read as disentanglement data filed as failure:
the diagnostic reports WHERE the gradients concentrated, not
just whether transfer cleared the bar.

## Executed re-reading 1 (2026-11-02, read-only: code + bank + verdicts)

VERIFIED (code): transfer probes zero observation.cue and set
odorPresent=false (odor-routed-experiment step), same history/codebook
unpresented, new resource seed, 256 ticks, frozen current vs reset.
VERIFIED (code): viability = energy vs travel-cost (overlapGuard) —
odor-independent, so the gate functions in-probe; B1/B2 transfer
failure is NOT forced-stop-by-zeroed-odor.
VERIFIED (verdicts): transfer-current MINUS transfer-reset means:
R1 +0.42, R2 −1.20, R3 −0.52, R4 +0.40, R5 −0.70, R6 −0.95.
INFERENCE (licensed by the three verifieds): the transfer regime
differs from training in MODALITY, not just instances — odor-present
training, odor-free probe. Cue-trace retrieval is disabled by design
(cues absent; Doyle: no overlap → no retrieval expected), so the test
measures non-cue carryover only. Negative gaps = the D-config's
odor-present specialization ACTIVELY HARMS odor-free foraging
(interference, not forgetting) — strongest exactly where D was most
specialized (R2 rehearsal, R5/R6 gating), absent where it wasn't
(R1 plain, R4 student). The probe punishes specialization: gate-bug
cousin (Asok) — is odor-free robustness the right demand of an
odor-guided learner? Future lines: probe WITH odor (fair cue test),
or claim odor-free robustness explicitly (own falsifier), or accept
the gate-bug reading. The six NO-GOs stand; what they MEAN changed.

## Executed re-reading 2 (2026-11-02, read-only: spent R5/R6 traces)

Mean alive-fly energy per 256-tick bin, all 8 acquisition histories:
R5 53.0 → 28.9 → 21.3; R6 53.0 → 28.9 → 20.2 (early → mid → late).
No late plateau — still declining (late-mid slope ≈ −8 per 512
ticks). Consistent with the B4-gate base rate (97%-negative deltas):
the runs end mid-dynamics, never at equilibrium. The late-phase
proviso is unrefuted and sharpened: nothing in the traces suggests
1792 ticks reached the slow phase where Kleim-structure appears.
Calendar proviso stands.

R7 sharpening (2026-11-02 — R7-INCOMPLETE-EXTINCT): the colony
died at tick 1911/3584 under R1 conditions extended. The proviso
now has a precondition: SLOW-PHASE STRUCTURE REQUIRES SURVIVAL.
The question is no longer just "does structure arrive with time"
but "can the colony live long enough to find out" — persistence
(VISION-2) fails at the colony level before the memory level.
Any line invoking the proviso must first show survival to slow-
phase ticks under its regime; otherwise the proviso is not
unresolved, it is inapplicable.

## Executed re-reading 5 (2026-11-02, read-only: spent R1/R5/R6 traces)

Alive flies per 256-tick bin (24 founders, 8/8 histories each arm):
ALL arms hold 24 through bin 4 (ticks 0–1279), then collapse in
bins 5–6 — R1 ends [1–4], R5 [1–5], R6 [1–5], same cliff shape
everywhere. Mortality is a synchronized LATE CLIFF, not attrition;
head-independent (gated heads die no faster). Combined with R7
(dead 1911 in doubled-phase-B): lifespan limit ≈1300–1900 ticks
regardless of phase — the colony has a maximum AGE, and slow-phase
structure is unreachable not because phases are short but because
lifespan is short. Specification sharpened: lifespan extension
(slower burn / better intake economics) precedes slow-phase
structure. The next line must first keep agents alive past ~1900
ticks; only then does the slow phase exist to be measured.

## Executed re-reading 6 (2026-11-02, read-only: spent R1 traces)

Per-capita energy economics by phase (physical events, 8 histories):
A intake 0.0217 cost 0.0482 net −0.0265; B 0.0160/0.0479/−0.0319;
C 0.0126/0.0466/−0.0340 (events 98k→62k as flies die); D
0.1171/0.0492/+0.0679 (only ~6k events — remnant feasts). Costs
FLAT every phase (~0.048); intake halves A→C. The cliff is
STARVATION ECONOMICS, not senescence: fixed burn, declining
return; the D-feast arrives for a remnant too small to matter.
A survival line must fix the A→C intake decline (or the fixed
burn), not D — specified HOW, not just "live longer."

## Executed re-reading 7 (2026-11-02, read-only: spent R1 anchors)

Depletion vs efficiency, decided: food amount GROWS 332.7 → 433.3
→ 561.5 → 649.1 across A/B/C/D (fill 0.37 → 0.65; regrowth
outpaces use) while intake halves and all 18–20 deaths are
energy-caused. DEPLETION REFUTED — the colony starves surrounded
by growing food. EFFICIENCY COLLAPSE confirmed: the agents get
worse at finding food that increasingly exists. Mechanism
specified: per-phase resource reshuffling (new seeds each phase)
invalidates spatial memory every phase boundary while steering
acts on stale maps — re-acquisition lags reshuffling, intake
ratchets down, the colony bleeds out. HYPOTHESIS (not finding):
that is the transfer wound at within-run scale — one phenomenon
(transfer tax, rehearsal cost, starvation) in three clothes.
Discriminator, pre-registered: a line that preserves maps across
reshuffles must SIMULTANEOUSLY lift transfer-tax, rehearsal-cost,
AND starvation if unity holds; if it fixes one but not the others,
the wounds are distinct mechanisms and the unity claim dies.

## Executed re-reading 11 (2026-11-02, read-only: spent R1 D-anchor)

Uniform-pessimism attractor CONFIRMED — the shared attractor named:
all 24 flies' taste weights mean-negative (−0.40 to −1.29,
positive fraction only 0.27–0.46); present-bank likewise negative.
Plain TD on 97%-negative deltas teaches "everything is bad",
identically, in every seed: the convergent misdirection MECHANISM
(rule, not data). Transfer as uniform avoidance explains flat
transfer without invoking forgetting. Fixes specified (not
executed): (a) reward centering/baselining (subtract background
loss so deltas aren't 97% negative); (b) distributional encoding
(optimism survives in upper quantiles — Dabney); (c) separate
Go/No-Go matrices (positives learned where the negative flood
doesn't reach — Bogacz/A5).
A survival line fixes re-acquisition speed (or stops the maps
going stale), never the food supply.

## Executed re-reading 12 (2026-11-02, read-only: spent R10 D-anchors)

The flood has an ADDRESS. Go/No-Go weight means per history: Go
7/8 positive (−0.022 to +0.596), No-Go 8/8 NEGATIVE (−0.231 to
−1.099). The old uniform-pessimism (single matrix −0.40 to −1.29,
R11) did not disappear — it was SORTED: positives live in Go,
the flood lives in No-Go, uniformly, on every history.
Architectural separation HOLDS (each matrix learned what it was
shown and nothing else). What remains is purely readout price:
the difference carries the lesson but taxes acquisition (R10 5/8,
one short). Any next rationale starts here — the negativity is
confined, named, and measured per history, not a fog over the
whole palate.

## Executed re-reading 13 (2026-11-02, read-only: spent R10 rows + r1plain)

The acquisition price is HISTORY-idiosyncratic, not phase-owned.
Per-history centered-minus-R1 diffs (A/B/transfer): no phase
concentrates the losses (A 3/8 clearly negative, B 5/8, transfer
3/8 — different histories in each set). Extremes coexist:
3285880790 wins everywhere (+2.36/+1.19/+3.42), 3170855589 wins
transfer (+2.77) while bleeding acquisition (−1.59/−2.49 — carriage
WITHOUT preservation), and 1172370180 preserves acquisition (+0.64)
while losing transfer (−3.68 — preservation WITHOUT carriage). A
phase-gated readout fix is NOT licensed by this cut (ruled out, not
merely unscoped): the next rationale must be history-adaptive or
readout-global, or it is curve-fitting to phases.

## Executed re-reading 14 (2026-11-02, read-only: spent R10 D-anchors)

The readout price has a MECHANISM: magnitude dominance. No-Go RMS
runs 2.0–2.35x Go RMS on ALL 8 histories (2.6–3.0 vs 1.2–1.4) —
invariant across histories, so structural to the instrument (the
flood sees ~97% of records, Go ~3%), not to the data. Go/No-Go
mean vectors point opposite-ish (cosine −0.43 to −0.78, never near
−1: genuine structural difference, not offset collapse). The
difference readout is therefore dominated 2:1 by the louder
matrix — Go's voice drowns in No-Go's volume even though they
disagree in direction. Candidate direction noted (not licensed):
magnitude-normalized readout; whether that clears the C17-bar as
genuinely-new versus a variation of (c) is for the scoping, not
this reading.

Standing disk note: C: free 3.64G and falling exogenously (was
4.49G; evidence dirs stable ~0.5G each — not this program).
Halt-and-escalate if any attempt is ever blocked; no attempt is
active.

## Executed re-reading 15 (2026-11-02, read-only: spent R10 anchors + verdict)

Weight statistics do NOT predict transfer — fourth strike. Per-history
normalized margins (Go-mean/Go-RMS minus NoGo-mean/NoGo-RMS): winners
0.256–0.824, losers 0.347–0.512, overlapping (a loser at 0.512 beats
two winners). Raw differences overlap too (0.693–1.695 vs
0.851–1.134). With means (R11), posfracs (R8/R9), norms (R9/R14),
and normalized margins (this cut) all failing to separate, the
readout-tweak family is exhausted ON EVIDENCE, not taste:
centering, distributional, split, normalized — no weight-statistic
reads transfer. What remains is behavioral/closed-loop: not what
the weights ARE at D, but what the agent DOES with them during
transfer (re-acquisition speed, exploration, probe-time dynamics —
the stale-map/survival line, the C17 closed-loop lesson). The next
rationale must live at probe time, not in the weight matrix.

## Executed re-reading 16 (2026-11-02, read-only: spent R1+R10 transfer probe traces)

The split readout DOES reach probe-time behavior — just not endpoints.
Transfer turn rates (odor-free probes, accept-all both arms by
construction): R10 turns less than R1 on 7/8 histories (0.50–1.00 vs
0.51–1.00, suppressions to −0.5: 748966988 1.00→0.50, 2672461838
1.00→0.67). Behavior moved systematically; endpoints went 5/8 noise.
Second dissociation (with R9's optimism-without-transfer): the instrument
changes what the agent DOES and the ledger still doesn't move. Probe time
is reachable (turning responds to the readout) but not yet steerable
toward energy. The next rationale inherits a working behavioral handle —
turning — with no demonstrated conversion to budget.

## Executed re-reading 17 (2026-11-02, read-only: spent R10 rows)

Go-positivity rank-tracks transfer (descriptive, n=8, no claim).
Sorted by Go-mean ascending: L, W, L, L, W, W, W, W — the top 4
are all transfer wins, the bottom 4 split 1W/3L (all-wins-on-top
p≈0.07 under null). Dose-response flavor supporting the PARTIAL's
own words (mechanism works): stronger Go learning goes with
transfer wins, with one exception each way (3170855589 wins at
+0.044; 2672461838 loses at +0.483). This licenses NOTHING new
(no second attempt, no re-tuning, no (d) — the freeze stands); it
is texture for the shelf: the readout is not arbitrary, it is
priced. Re-reading 19 sharpens it to a twin study (see below).

## Executed re-reading 19 (2026-11-02, read-only: spent R10 anchors+probes+verdict)

Twin contrast, opposite outcomes, near-identical weights.
Histories 1172370180 (transfer −3.68) and 3170855589 (+2.77):
Go means −0.022 vs +0.044, No-Go −0.982 vs −0.649, RMS ratios
2.27 vs 2.16 — weight statistics indistinguishable. What
differs is BEHAVIOR: transfer turn rate 0.915 vs 0.584, survivors
−1 vs +2. Holding weights fixed-ish, turning separates the
outcomes (direction: less turning, better transfer — n=2,
illustrative, causal arrow unknown; turning may follow energy,
not lead it). This is the R16 handle with a twin control: the
behavioral difference is real where the weight difference is
not. It licenses nothing (illustrative n=2, no freeze, no
instrument) — but the next rationale now has a twin pair to
explain, and "explain the twins" is a checkable bar for any
probe-time proposal.

## Executed re-reading 20 (2026-11-02, read-only: spent R10 D-anchors)

The flood is half-universal. Cross-history mean-learner cosines:
No-Go vs No-Go +0.64 (min +0.34), Go vs Go +0.60 (min +0.30),
Go vs No-Go −0.60 everywhere (max −0.32). So the badness direction
is substantially shared across histories but not identical — a
single universal pessimism vector explains ~60%, not ~95%.
Repair-one-vector would not fully transfer; the idiosyncratic
remainder (~40%) must be learned per history. Separation itself
is universal (all 64 Go/No-Go pairs negative). This bounds the
"rotate one vector" shortcut: real but partial, and the bar
still demands a full round, not a cosine, to prove it.

## Executed re-reading 21 (2026-11-02, read-only: spent R10 split-acquire + R1 plain-acquire traces)

The starvation path is readout-invariant. Split-acquire thirds:
54 → 32 → 12, all 8 histories, floors 11.7–14.1. Plain-acquire
thirds: 54 → 32 → 12, all 8, floors 11.4–13.0, same decision
counts (~32–35k). The two arms bleed identically through all
1792 ticks; the readout split changes NOTHING about the energy
dynamics — only the weight allocation at the end (Go positive
vs uniformly negative). The price is environmental, not
readout-caused: learning in this world costs more than it earns,
everybody starves, the question is only what weights you carry
out. Weights move, dynamics don't — the second dissociation
beside re-reading 16 (there behavior moved and endpoints
didn't; here weights move and the path doesn't). A next
rationale aimed at the readout should expect weight changes
with unchanged starvation; one aimed at the debt must change
the world economics, not the head.

## Executed re-reading 23 (2026-11-02, read-only: spent split + plain acquire traces)

The readout is fully behavior-neutral during learning. Turn
rates by third, split vs plain, all 8 histories: 0.28–0.33 vs
0.29–0.33, flat across thirds (starving agents neither search
more nor conserve — behavior frozen while energy collapses
54→12), arms interchangeable to noise. Same worlds, same
behavior, same energy path, different final weights: the split
touches NOTHING observable during acquisition except the
weight allocation it leaves behind. The narrator verdict
hardens from partial to full — and with it the price sharpens:
the ONLY thing bought by the transfer gain (5/8) is paid in
the ONLY thing changed (weights at exit). No hidden behavioral
compensation, no dynamics shift — the ledger has one line on
each side.

## Executed re-reading 24 (2026-11-02, read-only: spent transfer-current traces both arms)

Transfer probes are frozen readouts — confirmed to three
decimals. Turn-rate thirds are identical within every
history-arm (e.g. 0.751/0.751/0.749, 0.500/0.500/0.500);
nothing learns, drifts, or repairs in-probe, by design and
now by measurement. The split's transfer signature is a
threshold-crossing shift: quantized turn fractions (0.50,
0.59, 0.66, 0.75, 1.00 — the cue-mix fraction above a moved
threshold), suppressed vs plain on 6/8 (plain sits at 1.000
on 6/8: always turn). R16's handle resolved to decision
level: the readout moves the turn fraction, and the turn
fraction IS the transfer behavior. Corollary for the shelf:
no repair can happen inside a probe — any re-acquisition
proposal must act between probes, on training segments,
which is exactly where the bar's open example (b) points.
Validates the bar's framing; licenses nothing.

## Executed re-reading 26 (2026-11-02, read-only: spent A + transfer traces both arms)

The transfer instrument never opens the front door. Odor-present
fraction: A-probes 1.000 (7/8 exactly, one 0.995); transfer
probes 0.000 — all 16 probes, both arms, every decision. In
transfer the own-taste readout CANNOT fire (odor-absent forces
probability 1, accept trivially 1.000 everywhere); the frozen
weights express only through the spatial-recommendation side
channel (candidate-target scores via predictTargetTaste: split
vs plain differ slightly, 0.063–0.076 vs 0.060–0.092, no
systematic direction) plus entry debt plus motor dynamics. Every
transfer verdict R1–R10 is therefore a side-channel verdict:
what the weights do when their front door is shut. The twins
resolve instantly — same weights, same silence, outcomes
decided elsewhere. A with-odor transfer probe would be a
different instrument class entirely; transfer-side is CLOSED
per C16 and the C17-bar, so this is noted and NOT licensed —
but it bounds what all our transfer numbers mean: echoes,
not judgments. Precision (2026-11-02): odor-free transfer is
BY CONSTRUCTION, not accident — the experiment hard-codes
odorPresent=false in transfer (own-cue forced [0,0,0,0]); the
front door is bricked into the architecture, and B-probes
(odorfrac 1.000) confirm the other training world bears odor
normally. The instrument tests extinction by design.

## Executed re-reading 27 (2026-11-02, read-only: spent R10 + R1 D-anchors)

The debt is intensive, not extensive. Acquisition kills ~85% of
both colonies (alive at entry: split 2-5, plain 1-4 of 24) —
and the split survives acquisition EQUAL OR BETTER on 7/8
histories (+1,+2,+1,+1,0,-1,+3,+1). Yet it enters poorer 5/8
(to -26). More survivors carrying less each is NOT composition:
the survivor-gap vs entry-energy-gap scatters both ways
(+3→-26.2 but +2→+13.3). The split does not kill flies and
does not dilute by saving the weak — each living fly is poorer
per-capita. Two cheap stories dead at once (culling and
dilution); the intensive one stands: the readout's price is
paid inside every survivor's ledger, not in the headcount.

## Executed re-reading 28 (2026-11-02, read-only: spent R10 + R1 rows)

The transfer effect is mode-robust — not a comparator artifact.
Split-vs-plain wins by probe mode: current 5/8, native 5/8,
guarded 6/8, reset 6/8, native-full 6/8; signs stable (losers
stay losers on 6-7/8 across modes; magnitudes shift ±2). This
is NOT a rescore — the frozen verdict stands on transfer-current
by plan, and nothing here revises it. It is a robustness
characterization: the phenomenon (split carries better than
plain into the odor-free world) survives every readout mode
the instrument offers. A mode-fragile effect would have been
a verdict-qualification; a mode-robust one is a phenomenon
worth the shelf it sits on.

## Executed re-reading 29 (2026-11-02, read-only: spent R10 + R1 rows)

The readout tunes the carry, not the home. Post-training
odor-bearing probes, split-vs-plain: A-current +2..-2, B-current
+1..-2 — all sixteen within noise. Where the readout FIRES
every encounter, it changes nothing; where it NEVER fires
(transfer, R26), it moves outcomes ±5. Third dissociation:
the split's entire measurable footprint is Go-positivity in
weights plus transfer lifts plus acquisition endpoint diffs —
zero home-world footprint. The price is likewise not paid at
home (probes indifferent) but during learning (entry debt,
R18) and at transfer. A readout that matters everywhere
except where it acts: the side-channel story, closed from
both ends. Precision (2026-11-02): B is TRAINED, not a hidden
second transfer test — the rehearsal table runs A/B/A/C/A/D,
so B-current is a home probe and the indifference above covers
both trained worlds. The with-odor-transfer hypothesis died on
the frozen plan before measurement; the only transfer world
remains the odor-free one (R26).

## Executed re-reading 51 (2026-11-02, read-only: spent R10 transfer probes)

The instrument works: per-history transfer action-entropy computed
end-to-end from `probe-transfer-current` traces (8/8 histories,
512–1151 decisions each, action-2 cruise dominant throughout).
Entropy rank-tracks transfer at rho≈0.61 (n=8, suggestive not
significant): the pure-cruise history (1917475589, H=0.000, 512/512
action-2) WINS +1.01, the richest mixer (3170855589, H=1.339) wins
+2.77, the two leanest losers sit at the bottom. First probe-time
quantity that doesn't immediately die — and it bounds its own story:
H=0 wins, so exploration is not necessary; confounded by probe length
(512–1151), so entropy is not sufficient. A candidate, not a carrier.
Candidate recorded, gate unmoved.

Precision (2026-11-03): the length-confound quantified — probe
length (512–1151 decisions) rank-tracks transfer at rho=0.500, vs
entropy's 0.61. Entropy adds signal over mere length, but both flow
from the same downstream spring (colony vitality at transfer); the
shortest probe (512) wins twice, so length is not the story either.
Three downstream variables, one spring, none of them learned.

Precision 2 (2026-11-03): variant-robust — entropy-vs-transfer rho
recomputed across all five transfer-probe variants (current, guarded,
native-full, native, reset): +0.571 to +0.619 everywhere. Not a
one-variant fluke; the candidate survives the instrument's own
variations. Still a candidate (n=8, vitality-confounded), but a
stubborn one.

Precision 3 (2026-11-03): transfer-specific — acquire-phase
entropy recomputed from all eight `acquire-split` logs (~267k
decisions): H≈1.58 everywhere (near-maximum; training explores
uniformly), rho=+0.333 vs transfer (noise). At transfer the same
colonies differentiate (H 0–1.34) and the differentiation orders
outcome (0.57–0.62). Training is uniform noise; transfer is where
fates diverge — the program's core texture, now at the behavioral
level. The candidate lives at transfer or nowhere.

Precision 4 (2026-11-03): failed generalization — same computation
on R9's transfer probes (quantile training): rho=−0.119 (noise;
H=0 wins +1.25 AND loses −0.78). The candidate holds under
split-routing (R10: +0.57..+0.62 ×5 variants) and vanishes under
quantile-training. Bounded to R10's regime — or a small-n fluctuation
(n=8 both; R10 p≈0.14 uncorrected). The ledger records the miss
plainly: 1-for-2 across rounds. A regime-local texture, not a
carrier; the gate unmoved, the candidate fenced.

Precision 5 (2026-11-03): three-round panel — same computation on
R8's transfer probes (centered training): rho=+0.310. The panel
reads R8 +0.31 / R9 −0.12 / R10 +0.57..+0.62: present under split,
weak under centering, absent under quantile. The candidate is now
1-for-3 with one weak maybe — unreliable as a general carrier,
fully fenced to a single regime. The ledger's first probe-time
quantity survives in exactly one training world out of three. Filed
without flinching; the gate unmoved.

Precision 6 (2026-11-03): panel boundary — R2–R6 DO carry
probe-transfer traces (40 files each = 8×5), but their verdicts are
aggregate-only (no per-history transfer outcomes published); R7
never reached transfer (extinct at tick 1911). Computing my own
transfer metric on their traces would mix my measure with their
rounds — declined, same rule as the verdict-level extension.
The panel (R8/R9/R10) covers every round whose own verdict
publishes per-history transfer outcomes: the candidate was tested
everywhere the line's own verdicts allow testing. Boundary stated,
not breached; fence complete.

Precision 7 (2026-11-03): semantics verified — traced the action
encoding to source: COVERAGE_MOVES=[−1,0,1] indexed by action
{0,1,2}, and the trace logs action=move+1 (turn-forced −1 included).
So action 0=turn, 1=stay, 2=advance(cruise). R51's "pure-cruise
H=0" (512/512 action-2) and "cruise dominant" read correctly;
the entropy was computed over {turn, stay, cruise}, not arbitrary
codes. The ledger's newest numbers mean what they say.

Precision 10 (2026-11-03): rank-math audit — all reported rhos
recomputed with proper midrank Spearman (the ledger's scripts used
first-occurrence ties). Shifts: R10 transfer-H +0.571→+0.602
(inside the reported variant range), R9 −0.119→−0.144, length
+0.500→+0.509, R8/R48/R49/acquire exact. No conclusion moves:
R10 ~0.60, R9 noise, R8 weak. New: R8/R9 acquire-H −0.02/+0.19
(both noise) — training is uniform AND uninformative, line-wide.
The ledger's arithmetic checks out; the one method flaw found
changed nothing.

Precision 8 (2026-11-03): uniformity line-wide — acquire-phase
entropy recomputed for R8 and R9 (~equal decades of decisions):
H∈[1.582,1.585] and [1.580,1.584] across all 16 histories
(range widths 0.003–0.004 — flat to the third decimal). Training
explores uniformly in every round; transfer differentiates in
every round. The "training is uniform noise" half of R51's
texture generalizes line-wide even though the transfer-H half
does not. A uniform spring, divergent fates — everywhere.

Precision 9 (2026-11-03): uniformity full-line — acquire-H
recomputed for R2/R3/R5/R6 (32 more histories): all flat at
1.582–1.585, same as R8/R9/R10. Training uniformity now covers
56/56 histories across 7 rounds (R4 logs no training phase by
design — starvation; R7 never trained to transfer). Every colony
the line ever trained explored uniformly; every transfer
diverged. The spring is universal with exactly two principled
exceptions, both documented in the rounds themselves.

## Executed re-reading 50 (2026-11-02, read-only: spent R10 traces)

The pairing probe needs a plan, not an instrument. R10's traces
log per-tick decisions in dedicated transfer-probe phases
(`probe-transfer-current/guarded/native-full/native/reset`):
action, move, probability, route, feedProbability, energy,
raw sensors, cue, odorPresent, contactPresent,
recommendation point/pair/score, steering predictions, outputs.
Every probe-time quantity the bar's successors could need — action,
intake (energy deltas), exploration (action entropy), re-acquisition
(action|cue over ticks), closed-loop error (recommendation point vs
actual move) — is already a function over these fields. The
supposed blocker ("tag operationalization before pairing probe can
run") dissolves on inspection: the tags shipped with R10. What a
bar-passing round still owes is the rationale + frozen plan + fresh
bank — the instrument is waiting, not missing.

Precision (2026-11-02): 96 trace files = 8 histories × 12 phases;
all 5 transfer-probe variants present 8/8, plus A/B probes + acquire
log. The claim holds without qualification.

## Executed re-reading 49 (2026-11-02, read-only: spent R9+R10 verdicts)

Transfer sign is mechanism-invariant; acquisition is not. Same 8
histories, different training (R9 quantile vs R10 split): transfer
win/lose agrees 7/8 (p≈0.035 vs coin), magnitude rank-tracks
moderately (rho 0.476), while acquisition sign agrees 4/8 — chance.
The mechanism moves what you earn and modulates how much you carry,
but NOT whether you win: the verdict per history is set elsewhere
(entry/behavior/dice, per R17/R19/R44). The single flip (681849533:
loses −2.63 under quantile, wins +2.34 under split) bounds the claim —
mechanism can flip one history, not eight. Training chooses the size
of the fate, never its side (7 times out of 8).

Precision (2026-11-03): verdict-level panel — native-arm positive
histories across all 8 completed rounds: R2 4/8, R3 4/8, R4 5/8,
R5 5/8, R6 5/8, R8 4/8, R9 4/8, R10 5/8 (means +0.02..+0.40 where
published). The coarse verdict is regime-invariant too: about half
the histories transfer positive under EVERY training, with small
positive means. R49's per-history 7/8 is the fine structure of a
line-wide constant: the colony splits ~half-half no matter what
you teach it.

Precision 2 (2026-11-03): metric audit, CORRECTED — R2's
effects[mode].energy and R10's transferLift share the lift FORM
(trained minus a control) but NOT the baseline: R1-plain transfer
endpoints vs R2 native-control endpoints differ by up to 5.5
energy units per history. The count pattern (4,4,5,5,5,4,4,5)
stands as published verdicts, but cross-round like-with-like is
NOT established — the "line-wide constant" is downgraded from
audited finding to suggestive cross-verdict pattern. The ledger
corrects itself: precision 1's "constant" language overreached;
the per-round verdicts are clean, their comparability is not.
Filed, gate unmoved.

Precision 3 (2026-11-03): scope of the correction — R8/R9/R10
transferLift share the IDENTICAL scorer formula (candidate minus
same-bank r1Rows transfer-current endpoint, same 8 histories).
The correction touches ONLY the R2–R6 extension: R49's 7/8, R51's
entire panel, and the uniformity finding are all like-with-like
within R8–R10. Downgrade applies to the 8-round coarse pattern
alone (suggestive); everything computed inside R8–R10 stands
audited. The ledger narrows its correction to exactly what the
evidence requires — no more.

Precision 4 (2026-11-03): bank identity — R8/R9/R10 r1plain
banks are byte-identical (8/8 seeds, sha256 match all three
ways). The R8–R10 like-with-like chain now verified at three
levels: same scorer formula, same comparator bytes, same
histories. The correction's scope is itself audited: R2–R6
suggestive-only, R8–R10 airtight. Nothing left to check.

## Executed re-reading 48 (2026-11-02, read-only: spent R10 verdict)

Acquisition rank does not predict transfer rank (rho 0.071).
The twin loser PASSED acquisition (+0.64) and lost transfer
(−3.68); the twin winner FAILED acquisition (−1.59) and won
(+2.77). R13's dissociation, quantified at rank level: what
you earn in training says nothing about what you carry out —
the correlation is seven hundredths. Combined with R47 (weights
blind both heads): neither the learned values nor the learned
outcomes order transfer. Train-time success and transfer success
are independent draws from the same eight histories. The only
things that have ever tracked transfer are entry state, behavior
rate, and encounter dice — all downstream of learning, none of
them learned.

## Executed re-reading 47 (2026-11-02, read-only: spent R10 anchors + verdict)

No-Go rank doesn't track transfer either (rho 0.333, n=8,
nothing). Combined with R46 (Go-level refuted monotonically):
the readout's weight levels are transfer-blind, period — Go
marginal texture at best (R17, fenced), No-Go nothing at all.
The flood's depth doesn't order outcomes; the Go's height
doesn't determine them. What decides transfer lives entirely
outside the weights (entry, behavior, encounters — R18/R24/R30).
The question "do weights predict transfer" is now closed on
both heads: No and No. A proposal that tunes weights to move
transfer must explain why, when no weight statistic has ever
ordered it.

## Executed re-reading 46 (2026-11-02, read-only: spent R10 anchors A-D, all 8)

B-phase growth is universal — and Go-level doesn't imply transfer.
Every history's Go rises A→B (even the big loser: −0.070→+0.001);
then C freezes whatever B→C did. But 2672461838 carries the
SECOND-highest Go (+0.483) into a −2.94 transfer loss, while
3170855589 wins +2.77 on the lowest positive Go (+0.044).
Monotonicity refuted by construction: high Go neither saves nor
damns. This bounds R17 precisely: the weak rank-tracking lives
ENTIRELY in the A-set levels (R39, rho 0.952) — phase dynamics
add nothing, B grows for all, C locks all. Anyone citing R17's
tracking as mechanism must answer 2672461838 first: same high Go
as a winner, opposite fate. Texture, fenced on both sides now.

## Executed re-reading 45 (2026-11-02, read-only: spent R1 transfer + R10 acquire traces)

Turn-costs are neutral in both worlds; the price is world physics,
not action choice. Per-agent post-decision deltas: R1-plain transfer
turn +0.11..+0.26 (same as R10-split — universal); R10-split
acquire turn −0.045..−0.053 vs cruise −0.040..−0.044 — turns cost
a hair more while learning, pay a hair more while feasting, and
both gaps are second-order against the baseline flows (+0.15
feast, −0.045 bleed per decision). No action-based price mechanism
exists at any measured scale: the bleed is in the food physics,
not the feet. R44 generalizes across arms (plain same as split)
and phases (acquire same neutrality as transfer). The acting is
priced by the world it acts in, never by the act.

## Executed re-reading 44 (2026-11-02, read-only: spent R10 transfer traces)

Turning is not costly — suppression doesn't save. Per-agent
post-decision energy deltas in transfer: after turns +0.11..+0.21,
after cruises −0.03..+0.13, turn ≥ cruise on all 7 measurable
histories (1917475589 turns 100%, no cruises to compare). The
cheap mechanism dies: the split's turn-suppression (R16/R24)
cannot work by spending less, because turns pay as well or better
than cruises. The turn fraction is a behavioral SIGNATURE of
whatever the weights+entry+encounters produce — not an energy
lever anyone pulls. Third cheap story this arc has killed at the
decision level (after culling R27 and dilution R27): the handle
describes, it doesn't dispense.

## Executed re-reading 43 (2026-11-02, read-only: spent R1/R8/R9/R10 anchors)

The motor path is identical across all arms and both twins:
0.007→0.013→0.014→0.014 everywhere (A values match to 1e-4).
The motor is readout-BLIND — same trajectory whether the head
is plain, centered, quantile, or split. This confirms R23 from
the weight side: identical behavior (turn 0.28–0.33 both arms)
means identical coverage experience means identical motor
weights. The causal arrow runs behavior→weights here, not the
reverse — and since behavior is arm-indifferent, so is everything
it touches. The motor is not just weak and early-frozen; it is
the same motor in every colony, a constant of the paradigm, not
a variable of the experiment.

## Executed re-reading 42 (2026-11-02, read-only: spent R1 rows, survivors + intake)

Frozen steering STRICTLY dominates learned: more survivors (5–9
vs 1–4, all 8 histories — learned leaves lone wolves on three)
AND more total intake per founder AND higher endpoints. No
tradeoff at all — learned loses on every axis, everywhere. And
the failure modes differ by kind: the split's price is INTENSIVE
(R27: more survivors, poorer per-capita entry STATE) while the
learned steering's is EXTENSIVE (fewer survivors AND less total
— both down). Warning attached: per-END-survivor intake looks
like feasting under learned (up to 698 vs ~100) but is pure
denominator bias — the dead ate too, then died, and their intake
gets attributed to the living. States divide honestly;
accumulated flows don't. Two failure anatomies filed: intensive
(readout) vs extensive (steering).

## Executed re-reading 33 precision-audit (2026-11-02, read-only: spent R10 anchors)

R33's number audited itself and passed: present-motor rms
0.0072→0.0121→0.0135→0.0135 (A→B→C→D, both twins) — the
"0.007→0.014 by C" was exact, and the path adds timing: 85% of
motor growth lands in the FIRST stretch (A→B), same shape as the
taste (early set, mid flood, late freeze) at 1/400th the scale.
Self-audit: PASS, no correction. The temporal biography now
holds for both learners that learn: everything is mostly written
by B, fully written by C, and billed through D.

## Executed re-reading 41 (2026-11-02, read-only: spent R1 rows, 5 acquisition modes)

The archive held an unpublished experiment: R1 ran acquisition
under five steering modes, and frozen steering BEATS learned on
all 8 histories (+4..+10: frozen −50..−60 vs learned −59..−64;
guarded/native/reset cluster with learned). Steering MODE moves
acquisition ±10 — five times the split-vs-plain readout diffs
(±2, matched-mode). Two consequences: (1) R10's acquireDiff
gate survives strengthened — passing a ±0.5 band against a
baseline that swings ±5 across modes means split tracks plain
tightly within matched mode; (2) the steering system is COSTLY
doodling, not neutral — R35's unlearned variance prices at ~5-10
energy points vs frozen. The mode (policy class) moves outcomes;
the learning within it moves nothing (R34). Freeze the steering
and pocket the difference — a measurement, not a proposal.
Precision (2026-11-02): R8/R9/R10 all ran acquisition with
steeringMode='learned' (three frozen runners) — so every round's
absolute acquisition level carries the ~5-10 steering tax vs
frozen. Matched-mode verdicts (split-vs-plain, both learned)
are unaffected; absolute levels are depressed arc-wide. A future
acquisition that wants those points back must freeze the
steering (instrumentation choice, frozen plan, billed) — but
matched comparisons stay matched either way.

## Executed re-reading 40 (2026-11-02, read-only: spent R7 extinction trace)

Extinction is the universal bleed uninterrupted. The only colony
that ever died (R7, 1172370180, 1911 ticks) walks the SAME path
as every arm on every round: 57→41→25→12, with turn rate FLAT
at 0.31 throughout (0.321/0.309/0.345/0.301 — no panic, no
freeze, no conservation). The last ten decisions: energies
1.6→0.4, still turning. They starve doing exactly what they did
when fed; behavior unchanged from 65 to 0.4. No special death
mechanism — the ordinary path to its ordinary end, followed
119 ticks past where R10 stops. This confirms the starvation
story (R21) the hardest way: the bleed all arms share is the
bleed that kills when uninterrupted. Survival is not adaptation
(it never adapts — flat to the grave); survival is the run
ending before the bleed ends you.

## Executed re-reading 39 (2026-11-02, read-only: spent R10 anchors A + D)

The Go ranking is set in the first stretch: anchor-A order
predicts anchor-D order at Spearman rho 0.952 (only adjacent
swaps: 3243↔2672, 1917↔6818; the loser last at both, the
winner-table stable). The A-means already span −0.07..+0.52 —
the divergence is immediate, first phase, before any flood.
R31's fate-set-early upgrades from sign to full rank-order:
not only who is positive but the whole ladder is fixed before
the flood arrives, and the flood preserves it (all shift, none
pass). Combined with R17 (D-rank tracks transfer), the chain
is unbroken A-rank → D-rank → transfer: the ordering that
decides transfer is the ordering from the first stretch.

## Executed re-reading 38 (2026-11-02, read-only: spent R1/R8/R9/R10 anchors)

The 12-cell freeze table is complete. Taste 4/4 frozen, motor
4/4 frozen (present-bank bitwise, all arms, both twins) — and
steering 0/4 frozen, everywhere, always. The exception proves
the rule's irrelevance: the steering's C→D drift averages
1.7e-4 per weight against its own rms of 0.004 — Brownian
doodling around zero, no direction, no growth (rms flat-to-down).
So: nothing learns in the final stretch, anywhere, in any
stack, under any readout. Two stacks freeze bitwise; the third
never learned enough to have anything to freeze. The dead time
is total — 12 cells, zero learning, all billing.

## Executed re-reading 37 (2026-11-02, read-only: spent R8/R9 anchors C/D)

The C-freeze is paradigm-general, 4/4 arms. R8 centered weights
and R9 quantile weights (plus plain means): EXACTLY frozen C→D
on both twins — same as split (R31) and plain (R36). Every
readout family the program ever built converges by the same
checkpoint; the rehearsal schedule, not any head, sets the
freeze. R36's architectural claim upgrades from two arms to
all four ever tried. No readout, past or shelf, can buy a
later convergence by being different — difference lives only
in what each converges TO (flood, centered flat, quantile
spread, Go-positive), never in when it stops moving.

## Executed re-reading 36 (2026-11-02, read-only: spent R1 plain anchors A-D)

The C-freeze is architectural, not split-specific. Plain-arm
taste weights: means slide negative (flood path: +0.30→−0.19→
−0.43 and −0.22→−0.42→−0.85), norms grow (1.3→2.0) — then
EXACTLY frozen C→D on both twins, to four decimals. Both arms
converge by C; the last phase is dead time for everyone. So
split-specificity is WHAT freezes (Go-positive vs flood), never
WHEN: the schedule belongs to the paradigm (rehearsal table),
the content to the readout. A training-time proposal cannot
buy late-phase learning by switching readouts — the freeze is
in the architecture. It must either act in A/B or change the
schedule itself (new phases, frozen plan, fresh bank — a bigger
ask than a new head, priced accordingly).

## Executed re-reading 35 (2026-11-02, read-only: spent R10 traces)

The steering is an unlearned variance source, not guidance.
It acts often (25–46% across acquire/transfer) with ~zero
weights (rms 0.004, R34) and near-flat conditioning: P(steer=1)
0.19–0.30 across all motor×accept cells, both twins — a ~25%
coin with a whisper of tilt (accept-rows a touch higher).
It gates the movement target when it fires, so it injects
behavioral variance; but with flat conditioning and frozen
weights, the variance is unlearned. Whether that variance
HELPS (exploration) or merely jitters is NOT read-only
decidable — no counterfactual in spent traces. Bounded claim
only: the third pen is not just dry, it doodles. Guidance
lives in taste scores + entry + encounter mix (R24/R30); the
steering contributes unlearned variance of unknown value.

## Executed re-reading 34 (2026-11-02, read-only: spent R10 anchors A-D)

The colony has one learner, not three. Weight rms by stack:
taste norms ~5.5 (the only real learning), motor 0.007→0.014
(weak, frozen at C), steering 0.002→0.005 (spectator — an
order below weak, C→D drifting 0.004→0.004 and 0.005→0.004,
effectively nothing). The steering learner barely moves all
1792 ticks on either twin. So the turn fractions — the entire
transfer behavior — come from (near-zero motor + taste scores
+ entry state + encounter mix), with the taste as nearly the
only learned thing in the building. Single-solution (R25) was
about diversity; this is about magnitude: there is one pen
writing, two pens dry. Any account of what the colony "learns"
that spreads credit across three learners is triple-counting
one student.

## Executed re-reading 33 (2026-11-02, read-only: spent R10 anchors A-D)

Convergence is system-wide, and the transfer motor is untrained.
Present-bank motor weights: rms 0.007→0.014 by C, then EXACTLY
frozen C→D (bitwise, all learners) — alongside the taste freeze
(R31). Absent-bank (the transfer bank): rms 0.0008, ~17× below
the already-tiny present weights — effectively init noise, never
trained because training never leaves odor-present. By anchor C
the ENTIRE learnable stack is fixed; the final stretch moves
only positions, energies, and RNG. And in transfer, agents steer
through a motor bank that learned nothing, guided by taste
scores from weights that stopped learning a phase earlier,
spending entry debt they accrued while both slept. The last
phase is dead time for learning everywhere — the meter runs,
no one writes.

## Executed re-reading 32 (2026-11-02, read-only: spent rows + traces inventory)

The read-only boundary, declared. Spent artifacts contain NO
per-tick weights: rows hold endpoints (acquisition + probes),
traces hold 34,228 decisions/observations/physicals per history
(energies, actions, cues — never weights). So the within-phase-A
weight dynamics — WHICH encounters flip Go positive in the
first stretch where fates diverge (R31) — are UNRECOVERABLE
from everything the program has ever written. This is not a
gap to fill by re-reading; it is a wall. A future freeze that
wants the A-phase mechanism must instrument mid-phase weight
snapshots FIRST (new trace event or periodic anchor writes —
an instrumentation change frozen before the bank, billed in the
cap, null-arm identical). Until then, phase A stays a black
box with known input (init zeros) and known output (anchor A).
The diagnostic ends where the artifacts end; the next round
starts with better instruments, not better guesses.

## Executed re-reading 31 (2026-11-02, read-only: spent R10 anchors A/B/C/D)

The weight path through training, both twins: phase A sets the
sign (winner Go +0.073 21/24 positive, loser −0.070 2/24) —
the split's fate diverges in the FIRST stretch and never
reverses. B→C brings the flood on both (No-Go +0.15/−0.22 →
−0.49/−0.52 → −0.65/−0.98). C→D: taste weights EXACTLY frozen
(all 24 learners, both heads, bitwise) while motor banks,
steering, and credit keep moving and billing continues.
Converged early, paying late: the readout sits out the final
stretch on a fixed verdict while the colony keeps starving
through it. Temporal biography complete — early divergence,
mid flood, late taste-freeze with the meter running. Any
training-time proposal must act in A/B; by C there is nothing
left to steer, only bills left to pay.

## Executed re-reading 30 (2026-11-02, read-only: frozen code + bank protocol)

The agent side has zero variance left to give. In probes the
motor acts GREEDY by construction (exploration gated on
state.acquisition; frozen probes take argmax deterministically),
the taste accepts trivially (probability 1 on odor-absent),
and transfer probe seeds are UNIQUE per history (1004137408,
1023327705, ... — eight different encounter sequences). So:
KNOWLEDGE is fixed (near-identical weights, deterministic
greedy policy), USE varies (unique encounters + entry states),
OUTCOME diverges (twins −3.68/+2.77). The twins are closed
mechanistically: same function, different dice, different
starting chips. All cross-history transfer variance lives in
(entry state, encounter sequence) — none in the agent. A
probe-time proposal must therefore change the FUNCTION (the
greedy map from encounters to actions), because the variance
it would need to harness is all on the world's side of the
table. Use-vs-knowledge, proved from the code.

## Executed re-reading 25 (2026-11-02, read-only: spent R10 D-anchors)

The colony is one solution in twenty-four bodies — and survival
is weight-blind. Within-history learner pairwise cosines: Go
+0.74..+0.77, No-Go +0.83..+0.85, on the biggest loser, the twin
winner, and the biggest winner alike. No portfolio, no diversity
to select from: the flood is the same flood in every fly. And the
few outliers are not the saved: survivor typicality ≈ casualty
typicality (alive +0.78/+0.76/+0.72 vs dead +0.77/+0.73/+0.76 —
noise, no pattern, both directions across histories). Who lives
is not written in the weights. This buries a whole class of
stories: no learner carries the colony, no selection mechanism
can act here, the transfer object is a single solution whose
fate is decided downstream (behavior, luck, entry state — the
things re-readings 16–24 already isolated). A population
proposal must first CREATE diversity that is measured absent.

## Executed re-reading 22 (2026-11-02, read-only: spent transfer probes + R10 verdict)

Decision volume does not track transfer — on either arm.
Split-arm probe decisions vs R10 lift: 512→+1.01/+1.28,
768→−0.16/−2.94, 810→−3.68, 1024→+3.42/+2.34, 1151→+2.77.
Plain-arm (R1) likewise: winners span 256–998 decisions,
losers 256–1024. The two smallest volumes both win; the
largest non-winner loses big. Naive exploration-volume as
the transfer channel is descriptively dead (n=8, both arms).
This is why the bar's open example (c) demands a NAMED channel
plus conversion-to-budget proof: volume alone predicts nothing,
so any modulation proposal must say what exactly is modulated
and show the budget conversion — otherwise it is a re-tune
with an exploration costume. Constrains, licenses nothing.

## Executed re-reading 18 (2026-11-02, read-only: spent R1+R10 transfer probe traces)

Transfer feasts fine; the debt is all entry. Per-third mean energies
in transfer-current probes rise on BOTH arms on all 8 histories
(R1 +16..+44, R10 +12..+29 — same feasting shape, no slope deficit).
But R10 ENTERS poorer on 5/8 (entry gaps to −26: 3170855589 opens
20.6 vs 46.8 yet climbs +27.5 vs +16.1). The transfer-local
dynamics are intact; the endpoint gap is inherited acquisition debt,
not transfer-local failure. The wound's address narrows again: not
in how agents feast once transferred, but in what they carry in.

## Executed re-reading 9 (2026-11-02, read-only: spent R1 anchors)

Weight-norm drift across A/B/C/D anchors (flies 1/10/11 shown,
pattern holds): taste 2.6–4.4 → 4.2–5.3 → 6.0–7.5 → frozen;
steering 0.004–0.021 throughout (near-zero); banks tiny;
absent-bank 0.0 until D. NO collapse anywhere — unlearning-by-
norm-decay REFUTED. Two findings instead: (1) R1 is taste-driven
with a VESTIGIAL steering head (the celebrated +0.42 rides on
~zero steering weights — the head never learned, the palate did);
(2) intake-per-accept halves DESPITE monotonically growing taste
norms → misdirection, not decay (confident wrong, or right
weights in a reshuffled world). Next specified step: direction,
not magnitude — do the grown weights point anywhere useful
(compare vs probe-successful rows, read-only)?

## Executed re-reading 10 (2026-11-02, read-only: spent R1 anchors+rows)

Mean taste-vector direction vs transfer outcome (8 histories, median
split on transfer-current energy): within-bottom-4 cosine 0.58,
within-top-4 0.38, across 0.28 — with mean norms EQUAL (5.58 vs
5.50). Failures learned just as much, in a SHARED wrong direction;
successes learned diversely. Anna Karenina with magnitude
controlled: convergent misdirection, idiosyncratic success. The
shared-wrong direction across different seeds points at the RULE
(shared update/architecture converging to one attractor), not the
data — fix the rule, not the bank. (n=8, descriptive; no claim
beyond the pattern.)

## Executed re-reading 8 (2026-11-02, read-only: spent R1 traces)

Stale-map by distance: REFUTED. Mean recommended distance by
phase: 44.2 → 41.4 → 41.7 → 43.2 (flat); accept-rate 0.53 →
0.58 → 0.54 (flat; D 1.00 = odor-free accept-all). Intake collapse
is NOT longer trips or fewer acceptances — intake PER ACCEPT
halves (0.041 → 0.028 → 0.023) while food grows. The wound is meal
quality/discrimination, not travel or choosiness. Next specified
step (not executed): anchor weight-drift across A/B/C/D
(taste-bank norms in spent anchors) — if taste weights collapse,
the mechanism is learned-taste unlearning, tying retention +
discrimination + starvation into one intermediates file.

## Executed re-reading 3 (2026-11-02, read-only: spent R1/R2/R5/R6 traces)

Pairing-rule schedule check (Moncada: strong events near tags?):
intake share by acquisition thirds — R1(+0.42) [0.47,0.31,0.22],
R2(−1.20) [0.41,0.30,0.30], R5(−0.70) [0.45,0.30,0.26],
R6(−0.95) [0.45,0.30,0.25]. All front-loaded; late share does NOT
separate positive from negative transfer (R2 highest late share,
worst transfer). NULL result, honestly recorded: intake timing at
third-granularity carries no transfer signal. Rule unrefuted (tags
unmeasured — thirds are not tag times) but unconfirmed; the
schedule check needs tag times, not bins. Front-loading everywhere
is consistent with re-reading 2 (early phase does the eating).

## Executed re-reading 4 (2026-11-02, read-only: spent R1/R5/R6 traces)

Pairing rule at tag granularity (Moncada: top-5% intake ticks within
±64 of phase boundaries 512/1024/1536): R1(+0.42) 0.182, R5(−0.70)
0.213, R6(−0.95) 0.213. Second null — no separation favoring positive
transfer (R1 lowest). Finding upgraded: the pairing rule is UNTESTABLE
on spent traces without a tag operationalization (phase boundaries are
candidate tags, not measured tags). The diagnostic's probe needs a
frozen definition of "tag" in trace terms before it can run — currently
unspecified. Two nulls banked; the rule stands unrefuted, unconfirmed,
and now precisely untestable-as-stated.

Late-phase proviso (R800 — Kleim 2004): synaptogenesis and map
reorganization arrive in the SLOW phase; fast-early refines
existing structure only. The program's 1792-tick phases may all
be fast phase — transfer tested on an early substrate, judged as
if late. Structure needs the slow phase; every transfer reading
carries this calendar proviso until a line runs long enough to
void it.

Transfer formalism (R792 — Barreto 2016, successor features): the
A→transfer structure (fixed dynamics, changing rewards) is the
successor-features scenario natively: carry dynamics-knowledge,
reweight rewards. The bar above "beat reset": performance
guarantees before any learning. No program line has met it; now
the bar is named, and the diagnostic tests successor-structure
transfer (does dynamics-knowledge cross?) separately from reward
reweighting (do the weights adapt?).

Fifth split voice (R792 — DualPrompt 2022, title record):
general-prompt shared + expert-prompts specific, rehearsal-free.
With ATC, successor features, Go/No-Go, and consequence classes,
shared-general + specific-expert converges across paradigms from
proposal to regularity — the program's gated rounds are the
anomaly to explain, not the baseline to extend.

Gate redirect (R791 — Zhang 2017, rethinking generalization):
memorization and generalization coexist, so transfer gates must
test the ENCODER's abstraction (return-distributions), never the
policy's specificity. A verdict that punishes policy memorization
misreads deep learning; the diagnostic reports encoder-abstraction
as its primary measure.

## Null to rule out (R790 — Asok 2019, adaptive generalization)

Before any failure classification: rule out the gate bug —
generalization as adaptation (appropriate response to non-identical
contexts) punished by a specificity-demanding gate. The diagnostic
reports adaptiveness-vs-failure as its first cut; a gap that is
the system working must not be filed as the system broken.

## What it licenses

If the failure is specific-channel (nothing specific formed):
fix acquisition (the B-lane was right to look at learning).
If general-channel (specifics formed, maintenance generalized):
fix consolidation/maintenance (the B-lane looked in the wrong
place — the stop hypotheses were never the problem; the keeper
was). Either way the next odor line starts from a classified
failure instead of a measured gap.

## Synthesis: shared vs subjective (2026-11-02, zero new worlds)

Thirty-five re-readings, sorted by scope. SHARED (holds on all
8 histories — constrains every future rationale): energy collapse
54→12 both arms; behavior-neutral acquisition (turn 0.28–0.33);
zero odor in transfer vs 1.000 in training; Go/No-Go separation
sign everywhere; C→D exact freezes (taste bitwise, motor bitwise);
present-motor weakness (rms 0.014) and absent-motor near-zeros
(0.0008); steering flatness (0.19–0.30); home-probe indifference
(±2 all 16); volume-outcome scatter (no relation, both arms);
mode-robustness (5–6/8 all modes); ~85% acquisition mortality both
arms; single-solution colonies (+0.75/+0.84 within). SUBJECTIVE
(history-idiosyncratic — texture, not constraint): Go-sign at
anchor A (winner +0.073 vs loser −0.070); transfer outcomes and
magnitudes (−3.68..+3.42); entry gaps (−26..+13); survivor counts
(2–5 vs 1–4); which histories win which gate. The shared column
is the wound's anatomy — same on every body. The subjective
column is its biography — different on every fly. A next rationale
must respect the anatomy and may exploit the biography; confusing
the two (universalizing twins, or dismissing the flood as noise)
is the characteristic error this ledger exists to prevent.
