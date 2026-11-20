# RSI C17 PLAN V1 — FROZEN 2026-11-02 (non-oracle input reassignment)

Status: FROZEN. This document authorizes exactly one implementation
matching it verbatim, 16 fixtures, spent-bank triage, one fresh bank
build (472001–472054), and single attempt-01 (15 mains). No second
attempt, no rescoring, no tuning on eval seeds. Zero worlds spent by
this freeze.

## 1. License (C17-bar, from scoping)

(a) Genuinely new rationale: input-side intervention on the unmapped
input locus (all C-series lines C2–C16 operated weight-side or
vote-side). (b) Non-pooled external statistic: cue-specific
frozen-controller probe means (K vectors × S states), never a pooled
cross-cue vote (C16's drowning mechanism structurally excluded).
(c) Direction-first: pre-registered HB-only prediction with BH-flat
veto (G2). Scoping doc `RSI_C17_SCOPING_V1.md` (Q1–Q6 COMPLETE,
amended 15-mains) is the rationale record; this plan is the executable
freeze. Consult deviations recorded: min-mean selection (not the
consult's "maximum"), plasticity-ON overlay (not a frozen readout).

## 2. Arms and rows (15 mains max)

Per pair (3 pairs, V1m index layout [[0,1],[2,3],[4,5]] on 6 fresh
pair-histories with train→transfer flip structure):
- `train` on H_tr (transplant source; weights snapshotted on row).
- `transferred-exact` on H_te (exact transplant, uninterrupted
  BT_TICKS leg; the wound baseline).
- `transferred-indexed` on H_te (exact transplant + §3 intervention).
- `transferred-shuffled` on H_te (exact transplant + §3 intervention
  with random target; dose-matched §6).
- `unlearned` on H_te (fresh-bank validity: must stay flat).
HB/BH/same read per pair by the flip-split scorer (§7); HB legs are
identified per pair by the scorer, not by index.

## 3. Intervention procedure (identical indexed/shuffled except 3c)

1. Exact transplant with integrity: `assertFreshTarget` every target
   (ticks/buffers/motorPending zeroed, eligibility zeroed),
   `copyWeights`, `sourceDigest == appliedDigest` else abort leg.
2. Advance the BT_TICKS transfer leg (plasticity ON — standard
   protocol) with per-cue intake counters (cue identity × transfer
   context; no pooling).
3. Trigger: a transfer-beneficial cue reaching 2 intakes. Cues never
   reaching 2 are never reassigned.
   a. Sample S=32 states: the 32 most-recent pre-trigger decision
      states of this leg (deterministic).
   b. Probe bank: K=8 fixed random 96-dim vectors, norm-matched to
      the mean transfer-codebook vector norm (relative tolerance
      1e-9), presented to a frozen clone of the transplanted
      controller across the S states; turn propensity = fraction of
      turn decisions, mean over states (max-over-states reported).
   c. Target: indexed = argmin mean-turn (ties → lowest bank index);
      shuffled = seeded-uniform random bank index (seed = leg seed;
      recorded; may coincide with indexed by chance — recorded, not
      re-rolled).
   d. Replace the cue's vector (original archived, digests recorded);
      bill `probeOps` = K×S decision ops + read/write ops inline on
      the row (audited like lossy `scaleOps`).
4. Continue to leg end. Post-rate(c) vs pre-rate(c) on the same leg.
   Retain iff post > pre, else revert to the archived original
   (digest-verified revert; revert billed and recorded).
5. Retention window = remainder of leg; no cross-leg memory (single
   segment — no carryover machinery, no second transplant).

## 4. Fresh bank (build once, at implementation)

`rsi-c17-dev` bank builder mirroring V1m §72–88: deterministic fresh
472001–472054, 6 histories × 9 seeds
(seed/cueSeed/4 resourceSeeds/probeSeeds A-B-transfer) = 54 unique;
union-excluded (registry + engineering + spent + prior-evidence scans);
`experiment:'rsi-c17-dev'`; scope string names the single authorized
attempt. Verified clean pre-freeze (zero hits 2026-11-02); re-verified
at build. First use is attempt-01; any exposure spends it. Fixture
file AFTER bank build, referencing bank SHA.

## 5. Fixtures (16, all green before attempt)

F1 bank 54-unique + excludedSeeds + experiment tag. F2 history shape
6×9 with seed roles. F3 fixture-after-bank ordering (bank SHA pinned).
F4 `assertFreshTarget` (ticks/buffers/motorPending/eligibility).
F5 exact transplant integrity (digests equal, else abort). F6 bank
K=8, norm-match 1e-9 relative. F7 probe determinism + exact
`probeOps` count. F8 S=32 most-recent pre-trigger sampling,
deterministic. F9 evidence gate (no reassignment before 2 intakes;
per-cue independent counters). F10 indexed argmin (+tie rule).
F11 shuffled seeded-uniform (+recording). F12 revert restores original
(digest match). F13 scorer G0/G1 boundary (> +0.10 strict). F14 scorer
G2 veto band (±0.07 boundary behavior). F15 scorer G3 (shuffled
≤ +0.03; INVALID path) + dose-match verification (same counts, ticks,
thresholds on rows). F16 billing identity (`probeOps` in aggregate
ledger; probe decisions at inference rate — symmetric billing).

## 6. Dose-match (C7 CORRECTION)

Indexed vs shuffled differ ONLY in target selection (§3c). Same
trigger (2 intakes), same K/S/probe protocol, same ticks, same legs,
same evidence budgets, same retain/revert rule. Verified on rows
(F15); mismatch → INVALID, not NOGO.

## 7. Scorer and verdict (TRUE: same legs, same bank, same ticks)

Reuse `scoreFlipSplitV1m` per pair per arm; pooled over 3 pairs.
- G0 applicability: indexed fires on ≥1 HB cue; else INCOMPLETE-
  unfirable (substrate fact, not a negative).
- G1 direction (PRIMARY): pooled HB indexed − pooled HB exact >
  +0.10 (strict).
- G2 exclusivity (VETO): |pooled BH indexed − pooled BH exact| ≤ 0.07
  AND shuffled shows no pooled cue-general lift pattern; violation →
  NOGO (direction fails) even if G1 passes.
- G3 control: pooled HB shuffled − pooled HB exact ≤ +0.03; else the
  lift is generic-recoding → INVALID.
- Retention: train-side intact within noise; unlearned flat (validity;
  else INVALID-bank).
Verdicts: GO iff G0+G1+G2+G3+retention+validity; NOGO if G1 fails with
G0 met (or G2 veto); INVALID if G3/dose/validity fails; INCOMPLETE if
G0 fails. Fail-closed throughout; BH-flat is a veto.

## 8. Caps and attempt

15 mains + 0 separate probe executions (inline §3d); executions cap
300; aggregate op cap 5.0e9; wall 10800s; `T_WALL_CAP`/`CPU` per-row
V1m pattern. Attempt-01 only; `redone:[]` expected (resume only with
dual provenance on crash). Triage pre-attempt: 16/16 fixtures +
targeted synthetic checks green + spent-bank re-verification
(zero-new — read-only).

## 9. Record

Results doc `RSI_C17_RESULTS_V1.md` + status + synthesis addendum
whatever the verdict; loop-then-close per C-series discipline. Cumulative
ledgers updated (C-series headline + per-line exact).
