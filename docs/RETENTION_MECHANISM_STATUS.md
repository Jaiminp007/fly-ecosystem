# Retention-mechanism study — status (persistence file)

Objective: establish what causes the learner's retention and body-transfer
failures, then identify a justified next intervention through a bounded
measurement-and-mechanism study. Long-term objective: `docs/VISION.md`.

## Research-basis corrections (audited, no new worlds)

C1. **Two-timescale prototype is replay-volume, not direction.**
`learning/two-timescale-taste.mjs` (27 lines) implements uniform vs
recent-mix *replay source* selection with ONE weight vector — no slow weights,
no directional anchoring. Its offline test (`docs/RECENCY_REPLAY_OFFLINE_RESULTS.md`)
FAILED its gate in both corpora (recent-mix missed 6/8 histories in the
original corpus; A-at-C loss rose in both). The diagnostic's line-2 proposal
misdescribed it as slow-weight machinery; V3's anchor (slow-EMA rotation pull,
`learning/taste-energy.mjs`) is a separate, newly-written mechanism, also now
CLOSED (DEV-NOGO). Already-tested consolidation mechanisms (volume family):
`consolidationRate`/`motorConsolidationRate` slow-target rehearsal (V5/V6
lines in the RSI chain, closed without retention rescue).

C2. **localResourceSense is not novel — its screen already failed.**
`scripts/resource-outcome-study.mjs` already instruments `localResourceSense`
(amount channel at the locally selected patch) in an offline sensing screen:
`evidence/resource-outcome/3c9b3c4b-5881-49ec-9337-52f33149c608/results.json`
records `screenPassed: false` (sensed-policy gain CI crosses zero in stable;
paired-vs-unsensed ≈ −0.003..−0.001; forecast MSE not better). Any new-sense
line must beat this screen first and state what differs (live embodied
integration + retention readouts, not offline forecast gain).

C3. **Aggregate statistics do not establish mechanisms.** Overlapping buffer
composition (recent washout 0/8 everywhere), overlapping drift magnitudes
(5.2–8.4 L2) and uniform drift direction (cos ≈ +0.77) across pass/fail do
NOT establish identical interference mechanisms, directional-residue causation,
or a lifetime→retention causal link. All mechanism claims below are labeled
associational/exploratory unless the frozen plan's embodied contrasts support
them. Fixed-input readbacks (margins) are explicitly NOT causal.

C4. **Zero critic is expected under the progress rule.** `progressUpdate`
(`learning/taste-energy.mjs:253`) updates actor weights only; the td critic
path (`motorUpdate`) is unreachable under `motorRule:'progress'` (Gen1 base).
Critic weights stay at zero initialization forever. The diagnostic's "anomaly"
is a code-path consequence, not evidence. Closed, no follow-up.

C5. **V1 23-repeat reconciliation (artifacts preserved, numbers exact).**
Ceiling 440 = 104 mains + 336 probes UNIQUE completions (`ledgerUnique: true`,
`results.json:ledger`). Launches: 207 saved (prior ledger 54+153) + 23 unsaved
(6 mains + 17 probes, one history, EEXIST halt, `failure.json` preserved) +
233 remaining = 463 launch events, 440 unique. Burned 16,044,374,684 ops
includes the 23 redos (unique 15,058,855,558; delta ≈ 985.5e6 ≈ 23
executions' worth); `compute` + `resume.redoneHistories` + `audit.json`
record it. Protocol deviation: runner-only repair (`writeOver`, `--resume`
with bank-sha + source-manifest verification, per-source-anchor gate-7 fix
with INVALID original in `results-superseded.json`). Assessment: deviation
contained to the instrument, no world ran twice except the 23 documented
redos, no tuning knobs exist. No correction to verdicts needed; this note is
the consolidated accounting the objective required.

## Exploratory findings (read-only; hypothesis-generating, n=8/n=4)

Source artifacts: `evidence/body-transfer/{v1,v2}/attempt-01/{results,rows,anchors}`,
`evidence/body-transfer/v3-dev/attempt-01/`, readback `scripts/margin-readback.mjs`
(zero worlds; output NOT banked, temp files deleted after transcription).

E1. **Paired history-level body gaps (n=8).** V2 Q−N: dAret −0.62±0.20 (1/8
positive), dL −1.94±0.59 (1/8). V2 P−N: dAret −0.63±0.27 (1/8) — Q and P lose
*identically* on A-retention, supporting heading-coupling over translation
loss (Q preserves translation exactly). V1 P−N: dL −3.42±0.48 (0/8, level
collapse under harsh body) but dAret −0.10±0.27 (2/8, noisy).

E2. **Bank noise quantified.** Native A-ret: V1N −0.076±0.215 vs V2N
+0.485±0.185 (same learner flags, different 72-seed banks). Bank-to-bank
swing ≈ 0.56 with within-bank history SD ≈ 0.52–0.61. Back-of-envelope: even
20 banks × 8 histories leaves SE ≈ 0.12 if bank SD ≈ 0.5 — **do not assume
20 banks resolve ±0.1**. Resolution claims in the plan must carry this
variance decomposition.

E3. **Native retention predicts the transfer gap (associational).**
cor(N-aRet, body−N gap): V2-Q −0.80, V2-P −0.97, V1-P −0.92. Partly structural
(gap contains −N), but: cor(N,Q)=+0.24 with sd shrinking 0.52→0.34 and mean
shift −0.62 (uniform penalty preserving order), vs cor(N,P)=−0.73/−0.29
(reordering damage). Hypothesis: Q applies a history-independent retention
tax; P scrambles. Plan must stratify/condition on native retention and
predeclare constant-shift vs reordering contrasts.

E4. **Readout margins are intact where behavior fails (fixed-input).**
A-cue margins at atC: V1N +3.7..+3.9 (fracPos≈1.0) while V1N behavioral A-ret
= −0.076 (gate FAIL); V2 N≈Q ≈ +3.4..+4.0 with behavioral gaps −0.6; V2/V1 P
≈ +1.8..+2.6 still positive despite behavioral collapse. Margins GROW from
atA to atC (+0.4..+0.7). V3-dev: λ raises A-margins slightly at C
(+0.07/+0.25) while behavior worsens. **The taste readout classifies A-cues
correctly in every failing cell — retention failure is downstream of cue
classification.** This reframes V3's failure: direction protection targeted a
stage that was never broken.

E5. **B readout intact in N and Q** (margins +2.6..+3.1 at C, both bodies) —
consistent with passing bSkill; acquisition is not the problem anywhere.

E6. **V3 anchor moved weights without moving behavior** (bit-identical energy
across λ, |Δw|∞ up to ~0.5): sub-threshold distortion + harmful flips. Crosses
out "more anchor strength" as a follow-up; the locus is not the readout.

E7. **Action-choice changes unmeasured.** Fixed inputs cannot meaningfully
drive `chooseTasteEnergyAction` (raw is world state). AtA-vs-atC greedy-choice
comparison on identical probe seeds exists in V2 artifacts (early-A vs battery
probes share `probeSeeds.A`) but survivor mismatch (24 vs 18 alive) confounds
energy; choice-distribution comparison is plan work (embodied, budgeted).

## Hypotheses (ranked, all provisional)

H1 (locus). **Retention is lost downstream of the taste readout** — motor
action values, cue-world block routing, or greedy-inference policy — not in
cue classification. Test: controlled taste-vs-motor saved-weight
reinstatement (plan experiment R1).
H2 (body). Q's retention tax is history-independent (constant shift);
P reorders (idiosyncratic damage). Test: predeclared constant-shift contrast
on a fresh bank pair (plan, only if R1 implicates embodiment at all).
H3 (bank). ±0.1 retention detail is below single-bank resolution (E2); any
future qualification-scale claim needs the variance decomposition first.
Methodological, not mechanistic.

## Literature hooks (background only, no reviewed-evidence claims)

Slow/elastic weight consolidation (EWC/SI family) is the standard frame for
direction-vs-volume protection; V3 tested the directional variant and it
failed at the wrong stage (E4/E6). No web-search tool is available in this
environment; targeted literature comparison is deferred to plan discussion
and does not gate the mechanism experiment.

## Expenditure ledger (mechanism study)

- Worlds: 100 new R1 probes (25,600 world-ticks, 614,400 founder-slots, ops
≈3.4e9 estimated via V2 per-probe mean — labeled estimate). Cumulative
program total: 5128 + 440 + 688 + 228 + 100.
- Seeds: 0 spent. V2 bank reused read-only (spent, predeclared non-qualifying).
- New code: `scripts/margin-readback.mjs` (exploratory readback; temp outputs
deleted, findings transcribed); `scripts/reinstate-probes.mjs` (frozen R1
instrument, fixtures 4/4); `scripts/score-reinstatement.mjs` (analytic
scorer); `tests/reinstate-probes.test.mjs`.

## Next action — DONE (R1 executed, verdict SUPPORT-H1-motor)

Plan FROZEN (2 pre-execution corrections with reasons); `docs/RETENTION_MECHANISM_RESULTS_V1.md`
published COMPLETE. Taste reinstatement moves retention ~1e-6 (inert —
readout saturated-correct everywhere, E4 + saturation mechanism); motor
reinstatement restores near-atA levels 7/8. Frozen fraction rule fired
numerically but is misspecified (non-monotone denominators); the audit's
absolute analysis carries the verdict. Decision: recommend a MOTOR-side
intervention line under a separately frozen plan; taste protection stays
CLOSED; H2 needs a fresh-bank follow-up (not launched). No qualification
use, no PASS/RSI claim.
