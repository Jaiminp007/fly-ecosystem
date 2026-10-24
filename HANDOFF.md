# Afterwing / Fly Ecosystem: complete paused research handoff

**Read this first in a new thread or on a new machine. Research is paused at the user's explicit request. No RSI result has been demonstrated. This PR is a continuation snapshot, not an approved policy release.**

The user asked to stop the current work, commit it, and make a comprehensive PR carrying the source, evidence, Astra consultation, touched-file map and exact continuation state. Preserve the failed studies. Do not restart a finished campaign or silently resume a habitat while setting up.

## 1. Fast new-machine setup

Clone and check out this PR branch, then restore the bundled evidence before running historical audits:

```sh
git clone https://github.com/Jaiminp007/fly-ecosystem.git
cd fly-ecosystem
git checkout handoff/afterwing-astra-research-20261024

# Python standard library only. Verifies every compressed chunk and every file.
python3 scripts/research-evidence.py restore
python3 scripts/research-evidence.py verify

# Install only the numerical-audit dependencies in an isolated environment.
python3 -m venv .venv-research
.venv-research/bin/python -m pip install -r requirements-research.txt

npm test
python3 -m unittest connectome.test_controller_adapter
```

There are no npm runtime dependencies. The compact platform requires Node >=22. For the optional historical-path loader use Node >=22.15; the reference research session used Node 26.5.0. Reference numerical environment: macOS 26.1 arm64, Python 3.9.6, NumPy 2.0.2, SciPy 1.13.1. Broader dependency ranges support a modern isolated Python, but cross-machine bitwise physical replay has not yet been verified. Preserve and investigate an actual mismatch rather than assuming its cause or relaxing a scientific gate.

The complete evidence is stored in standard gzip/tar chunks under `handoff/archives/`, each below GitHub's individual-file limit. [The manifest](handoff/evidence-manifest.json) lists every original path, byte count and SHA-256, plus each archive-part hash. The restore command refuses to replace a different existing file. Raw evidence stays ignored locally; selected protocols/audits are also committed as readable review files. No evidence result is discarded merely because it failed.

To restore the saved **paused** habitats and the stopped learning-lab state on a fresh machine:

```sh
python3 scripts/research-evidence.py restore --runtime
PLATFORM_WORLD_WORKERS=1 npm run start:platform
# Open http://127.0.0.1:8767
```

`--runtime` installs the saved exports into ignored `runs/platform/` and `runs/autonomy/`. It starts no processes and refuses conflicting runtime files. Ten habitats were paused at capture; the learning-lab API reported `running: false`. Snapshot details live in restored `handoff/runtime-snapshot/manifest.json`. These are point-in-time, read-only checkpoint exports, not new scientific qualification. The rolling checkpoint timer is reset in recovery metadata; biological world state is preserved. Old rolling/manual platform archives outside the research evidence are not all copied.

**Use `npm run start:platform` for this work.** `npm start` launches the separate MaleCNS connectome track, which requires its own substantial data preparation. The compact artificial learning studies do not establish results about the full MaleCNS model. `data/`, virtual environments, node_modules and MaleCNS downloads are not bundled.

## 2. The objective and its exact status

The original active research objective was:

> Achieve and rigorously demonstrate recursive self-improvement in the Fly Ecosystem: autonomous changes to the learning algorithm, validated on fresh tasks with retained skills and matched controls; preserve failed results and do not claim RSI without evidence.

After Astra's review, the user explicitly requested implementing its staged program and changing the working goal. [RESEARCH_GOAL.md](docs/RESEARCH_GOAL.md) records the replacement objective:

> Audit a locked intervention study separating action-assignment bias, observation-history limits and reward horizon; qualify continuing embodied learning and retained skills on distinct tasks under memory pressure; then test successive persistent autonomous algorithm revisions and improved subsequent search against copied-improvement and matched budget controls.

The old native goal tool refused replacement because an unfinished goal existed. It exposes status changes rather than an objective edit. We recorded the revised objective in the repository and continued working; we did **not** falsely mark the old research complete. On the user's stop request the native goal was successfully set to **paused**. On a new thread, create/resume a goal only when the user authorizes it; do not claim the old paused objective was achieved.

Stage 1 is completed and failed its scientific gate, with complete audits. Stage 2 has an implemented candidate and experiment substrate with tests, but **no frozen fresh performance protocol, no campaign runner, and no embodied qualification result**. Stage 3, a persistent causal recursive-improvement campaign, remains unimplemented and unachieved.

## 3. The most recent completed experiment

[Full result report](docs/INTERVENTION_RESULTS.md) · [protocol/design](docs/INTERVENTION_STUDY.md)

Authoritative directory after archive restoration:

```text
evidence/intervention-study/20261024-assignment-history-horizon-v1/
```

The design used eight development seed pairs, split into four training and four selection pairs, followed by sixteen distinct held-out seed pairs. Stable and relocating-food worlds contained two predetermined observed founders, sixteen checkpoints per world, two forced first-speed branches, and eight-/256-tick outcomes. Each factual matching branch had to reproduce the whole natural continuation. Counterfactual labels trained pooled offline diagnostic references, never a live fly.

The fixed selection was **current-observation direct IPW contrast at 256 ticks**. It failed all six action comparisons and all six weighting-follow-up comparisons. Mean selected-minus-incumbent energy advantages were -0.096609 in stable worlds and -0.058549 in relocation; versus fast-first-action they were -0.190988 and -0.087565. No sample extension, held-out reselection or adoption occurred. Eight-/256-tick action-effect signs disagreed in 46.78% of active held-out cases. No terminal case occurred in this particular performance bank; terminal software tests do not supply mortality-performance evidence.

The cold audit reproduced **all 48 worlds, 1,536 scheduled cases, 786,432 fork steps and 64 fitted model states**, including selection, scores and gate decisions. Independent Python arithmetic checked every fit and all twelve comparisons. The final supplemental checker recorded zero warnings, maximum coefficient difference 2.668e-14, inverse residual 7.684e-14 and delayed-DR target difference 5.898e-17.

Important preserved corrections:

- The first DR implementation used overlapping outcomes before they were available. Astra caught this before protocol freezing. The frozen implementation releases nuisance labels only after their horizons end and handles simultaneous founders correctly.
- Astra also caught missing executed-source enforcement and insufficient row identity checking. The frozen runners require captured entrypoints and verify every registered seed/environment/checkpoint/founder identity.
- A first scoring command ran before the bank finished and refused the missing files. Its log is preserved; it produced no result.
- Earlier Python checker versions emitted matrix-multiply warnings despite passing comparison assertions, and their warning list did not cover all operations. All sources/reports/logs are retained. `supplemental/audit-intervention-numerics-v3.py` captures warnings globally and uses explicit finite reductions. It reproduced the same scientific results without warnings. No cause was invented for the earlier warnings. See `numeric-checker-resolution.json`.

Do **not** advance IPW, choose a different method from the held-out diagnostic table and call it qualified, or repeat this unchanged sample until it passes. A hindsight oracle demonstrates an upper bound with future information, not usable learnable headroom.

## 4. Astra: where the advice came from and how to continue it

Original independent top-level T3 conversation:

- [Astra independent RSI review](t3-thread://v1/mcp:1c9455cc-ca9f-4a5b-9ce3-5195a55afb00)
- Exact ID: `mcp:1c9455cc-ca9f-4a5b-9ce3-5195a55afb00`
- Model: `gpt-6-astra`; originally launched with ultra reasoning.
- The authoritative source checkout was the October 21 working tree, not the different scratch path initially reported by the launch API. Astra verified the correct source path and HEAD through real commands.
- Five runs are now terminal. The first failed before delivering its conclusion; the existing thread was resumed rather than duplicated. Later runs completed the strategy review, protocol review/correction check, and next-candidate recommendation.

Everything needed without that original machine is committed:

1. [Original complete brief](docs/ASTRA_REVIEW_BRIEF.md).
2. [Complete first strategy conclusion](docs/ASTRA_REVIEW_RESPONSE.md).
3. [Root's decision record](docs/ASTRA_REVIEW_DECISION.md).
4. [Full next embodied-candidate recommendation](docs/ASTRA_EMBODIED_RECOMMENDATION.md).
5. [Complete public-message transcript](docs/ASTRA_THREAD_TRANSCRIPT.md): 23 briefing, progress, response and follow-up messages with run/position provenance. Private reasoning and raw tool calls are not included.
6. The intervention's `review.json` preserves the pre-freeze no-go findings and the corrected go-ahead.

In the same T3 environment, read the existing thread with `t3_thread_read` and continue it with `t3_thread_send`. It is an ordinary top-level conversation, **not a delegated child task**. Do not create duplicates merely because a wait times out. Reads paginate by `nextPosition`; long messages by item/text offsets.

On a new machine/environment, the old thread ID or provider instance may not exist. First read the committed transcript. If an Astra consultation is authorized, discover the **current** Astra provider/model/options with `orchestrator_capabilities({search:"astra"})`. Do not hardcode the old provider instance. Create a top-level thread only when that is the requested workflow, choose the actual cloned checkout with `workspaceStrategy`, retain the returned thread ID, and verify its actual working path. Supply this handoff, the complete Astra recommendation/transcript, current source paths and unresolved objections. Make the review read-only unless implementation is explicitly delegated. Do not substitute another model and claim Astra reviewed it.

Suggested review brief: “Read HANDOFF.md, docs/ASTRA_EMBODIED_RECOMMENDATION.md and the public transcript, then inspect the current SarsaExperiment, cost ledger and probe code. Give concrete blockers or a go/no-go for the fresh embodied screen. Preserve all failed gates. Do not run simulations, edit files, spawn agents or change the research objective.”

## 5. Astra's major findings that must survive this handoff

- Forecasting, physical control and the ability to discover a better learning algorithm are distinct capabilities. Applying the same mathematical learner to two components does not establish recursive improvement.
- The prior small kernel-library selector had little demonstrated search headroom. Self/static final choices were identical in all sixteen histories; the original modifier matched in fifteen and did better in the other. A changed query order is not improved productivity.
- Retention claims were overstated. Root independently confirmed 84.375% duplicate B-training examples in the earlier migration bank and 82.3103% in the recursive target bank. Both sequences held only 224 examples against capacity 256. Those tests do not establish distinct-task retention under interference or memory pressure. The measured forecast results and failed recursive gate remain preserved.
- Eight-tick outcome quality is not sufficient for continuing embodied learning. The new diagnostic reinforces this: short and long action rankings often disagree.
- A small per-agent observational history, nominal action probabilities and passing IPW/DR code tests do not by themselves establish action-value improvement or identify systematic selection bias.
- Use a persistent embodied learner, real own trajectories, a bounded task-blind transition memory, frozen probes, actual memory pressure and explicit costs.
- For eventual recursion, copy the **same improved body learner and same accumulated facts** to both branches. Vary only the improvement procedure and test discovery of the next beneficial algorithm under equal total budgets. Otherwise better bodies or larger archives can masquerade as a better self-improver.
- Require at least two successive accepted algorithm revisions, retained embodied skills and a multiplicity-controlled causal search-productivity advantage before claiming bounded RSI. General intelligence, biological cognition and open-ended improvement remain unproved aspirations.

## 6. The exact next candidate and existing implementation

Astra recommends **one fixed speed-only decision-level Expected SARSA(λ) candidate**, not another kernel or propensity search:

- Current plus three previous own-decision observations/actions, fixed normalization, no phase labels or privileged information.
- Existing slow/fast motor levels, ε=0.1.
- Actual eight-tick transitions and net energy change including charged work.
- Decision discount `exp(-8/256)`, online λ=0.9 traces, zero terminal bootstrap.
- One fresh replay update per completed decision. Store sixteen recent transitions and forty-eight reservoir-sampled older transitions. Do not replay online traces across unrelated records.
- Fixed current engineering rates: live update 0.05, replay 0.01. These are proposed configuration choices, not fitted successes.

Implemented files:

| File | Current responsibility |
| --- | --- |
| `learning/sarsa-body.mjs` | Per-body two-action value parameters, normalized history features, live traces, Expected SARSA, task-blind hybrid replay, separate random streams, frozen/reset state, restoration. |
| `learning/sarsa-experiment.mjs` | World + per-body learners + resource clock + old skill snapshots + bills in one checkpoint. Seven main arm identities; mandatory prices; common-body frozen probes. |
| `learning/continual-regimes.mjs` | A512 stable → B512 moving → C512 scarce → return-A256. Independent resource layouts, conserved food amounts/energy, no body or acquired-state reset. B moves renewal centers at 128-tick intervals. |
| `learning/embodied-control.mjs` | Opt-in choice from actual current sensors. No preview/fork outcomes. Forces only the selected speed while preserving the incumbent sampler's future RNG continuation. Price/payment callbacks. |
| `engine.mjs` | Optional experiment callback before controller execution, physical extra-cost billing and paid-amount receipt. Default paths remain separate from the experimental adapter. |
| `learning/own-experience-learner.mjs` | Earlier unqualified conditional/long-window prototype. Preserve it; do not advance it unchanged or call it the selected SARSA candidate. |

Candidate/matched ablation arms explicitly set both native episodic memory learning and remaining neural-output learning **off**. The legacy incumbent is a separate disclosed reference. This avoids hidden acquisition defeating a frozen/reset or 64-record comparison. No live platform imports the SARSA experiment adapter.

The cost model prices the declared canonical encoded state and recorded scalar work separately from actual wall/CPU time. Numbers are float64; booleans/null, strings and containers have explicit encoding rules. Storage includes parameters, traces, histories, replay, RNG/counters and pending state. Paid charges enter the physical energy ledger; unpaid work is retained and deducted by the budget-adjusted endpoint. Terminal work is retained as a bill. This is an explicit model accounting decision, not a measurement of JavaScript heap bytes or biological metabolism. Actual runtime still needs recording in the campaign runner.

Combined checkpoints include the physical world, every learner, all exploration/replay/retention streams, traces, the phase clock, old skill snapshots and outstanding charges. Canonical JSON zeros cover immutable snapshots as well as live state. Tests verify continuation across phase changes, not just isolated learner serialization.

## 7. What is unfinished: exact resume point

**Do not launch performance qualification immediately.** The latest interruption was during preparation, before a SARSA campaign runner or frozen protocol existed.

1. Read and review the full SARSA source and tests. Most recent targeted run of `tests/sarsa-experiment.test.mjs` passed all four tests, including joint continuation and common-body frozen probes. A final whole-suite count is recorded in the PR validation/handoff verification file. Passing tests are not learning-performance evidence.
2. Complete a single fixed-candidate fresh screen runner, an independent audit and a locked protocol. No SARSA scientific seed bank or result has been generated. Exclude the intervention's seeds and the engineering/unit-test seeds; scan restored registries.
3. Use sixteen fresh seed histories and seven main arms: candidate, λ=0 with the same replay, frozen after A, acquired reset at B/C, original incumbent, always fast, always slow. That is 112 main worlds before probes. Do not tune on confirmation results.
4. Reconcile the probe budget before freezing. Astra proposed at most 128 extra probes, but the currently implemented complete comparison matrix has **nine probes per history**, totaling 144: A uses saved-A/current-C/reset; B uses saved-A/saved-B/current-C/reset; C uses saved-B/current-C. All versions share end-C physical bodies and unseen family resource seeds. This supplies B-acquisition, C-acquisition and separate A/B learned/retained/reset comparisons. Explicitly choose and document the resulting budget before any outcome, rather than pretending nine fits into eight. Current implementation has the nine-entry `SARSA_PROBES` constant; no campaign has accepted that budget yet.
5. Check the cost rule, experiment receipt accounting, debt-adjusted reward/endpoint, late/terminal work, frozen/reset semantics, all-founder denominators and common probe states. No hidden legacy acquisition is allowed in matched experimental arms. Preserve actual resource inventory and delivered regrowth: a lower renewal setting does not prove immediate food scarcity.
6. Predeclare multiplicity handling and the inference unit (independent seed histories). Required performance includes B/C acquisition over frozen earlier states, whole-sequence energy over incumbent and both constants, initial earlier-skill advantages over reset, and separate paired retention noninferiority retaining at least 95% of the learned A/B advantages. Set the exact linear contrasts and survival guard before seeing outcomes. Trace-specific attribution additionally needs the λ=0 comparison. Do not call equal observed survival a demonstrated survival benefit.
7. Frozen probes must never train main learners. The current probe implementation clears transient history/traces/pending outcomes, synchronizes policy RNG to the common end-C state, freezes acquisition and resets *prospective probe* cost counters. All original founders remain in each denominator; already-dead founders are not replaced or resurrected.
8. Capture and execute the entire runner/import graph from the frozen source tree, validate every expected row identity and coverage, save failures, and cold-replay all reported results. The first intervention taught us why each of those constraints matters.
9. If any required gate fails, record the candidate as failed. Do not choose another method from that same held-out bank. A pass supplies a bounded embodied substrate only; it does not supply autonomous algorithm revision, live ecological promotion or RSI.
10. Only then implement persistent generations, meaningful executable learning-rule/proposal changes, acquired-state migration, immutable fresh external gates and the copied-improvement recursion control. This stage has not been built.

## 8. Earlier research evidence and limits

| Work | Key record | Result boundary |
| --- | --- | --- |
| Forecast migration | `evidence/algorithm-upgrade/38de8132-b429-46d6-a025-2e31de80e865/` | Gaussian-gradient migration passed forecast MSE gates; no embodied or recursive-productivity proof. Retention overlap correction applies. |
| Actual budgeted modifier search | `evidence/recursive-search/092e609c-4734-4cf5-8367-0482e4258694/` | Gate failed versus original/static controls despite better forecast programs. Twelve human-written kernel/update programs, not arbitrary code synthesis. |
| Retention-design correction | `evidence/retention-overlap/89d095c0-27fd-48bb-a859-3cb6614aca98/` | Exact duplicate-example and below-capacity audits. Interpretations corrected without altering recorded scores. |
| Archived physical action diagnosis | `docs/KERNEL_ACTION_DIAGNOSIS.md` | Did not establish both-environment benefit or superiority to fast movement. Post-hoc old forks, not fresh qualification. |
| Behavior policy recovery | `evidence/behavior-policy/6ca3c055-a45d-4948-9680-c0837fd2e9d6/` | 24 archived worlds/10,800 windows and nominal sampler replay. Plumbing, not causal identification or policy benefit. |
| Stable cruising / moving-food qualification | `docs/EPISODIC_CRUISE.md` and later episodic reports | Useful stable-world learning; joint relocation/survival and later upgrade gates repeatedly failed. Do not erase failures. |
| UI/runtime | `docs/PLATFORM.md`, `docs/RUNTIME_WORKERS.md`, `.taste-skill/` | Dashboard and behavior-preserving runtime work. Old observations describe their captured workload, not an ongoing speed guarantee. |
| Full MaleCNS | `docs/MALECNS.md`, `connectome/`, `vendor/` | Separate model/data track. Compact-controller results do not establish connectome cognition. |

[AUTONOMY_PROGRESS.md](docs/AUTONOMY_PROGRESS.md) is the chronological research index; [the vision](docs/VISION.md) is aspiration, not proof. The archive retains earlier failures, checkpoints, source snapshots, numerical diagnostics and UI evidence. Old status files saying `running` can be historical snapshots; use current process/API evidence rather than treating a saved field as a live job.

## 9. Files, historical paths and safe audit commands

[The touched-file catalog](docs/HANDOFF_FILE_INDEX.md) lists every source/document/test/UI file in this PR. [The evidence manifest](handoff/evidence-manifest.json) lists every restored evidence/runtime file. The PR body groups the changes for review; the archive retains all raw artifacts.

Historical protocols contain the original absolute checkout path:

```text
/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85
```

Do not rewrite authoritative protocol bytes to update paths: their hashes are evidence. The newest intervention is self-contained after restoring the archive. For older **Node** audits, `--import ./scripts/portable-evidence-loader.mjs` translates reads and ESM imports from that old root to the current checkout without changing data. The shim does not redirect writes and is not a general Python path migration. Its filesystem/import behavior has a dedicated test; not every historical audit has been revalidated on another machine.

Read-only integrity verification:

```sh
python3 scripts/research-evidence.py verify
```

Independent numerical recheck with an exclusive new output file:

```sh
CHECK_DIR=$(mktemp -d)
.venv-research/bin/python \
  evidence/intervention-study/20261024-assignment-history-horizon-v1/supplemental/audit-intervention-numerics-v3.py \
  evidence/intervention-study/20261024-assignment-history-horizon-v1 \
  "$CHECK_DIR/numeric-audit.json"
```

Optional full cold replay, when research verification is authorized again. Use a copy so the auditor does not overwrite/refuse the existing `audit.json`:

```sh
AUDIT_DIR=$(mktemp -d)
cp -R evidence/intervention-study/20261024-assignment-history-horizon-v1/. "$AUDIT_DIR/"
mv "$AUDIT_DIR/audit.json" "$AUDIT_DIR/audit.recorded.json"
node "$AUDIT_DIR/sources/scripts/audit-intervention-study.mjs" "$AUDIT_DIR"
```

Run from the cloned repository root so the frozen seed-registry paths resolve. This physically replays the existing bank; it is not a new independent scientific sample. The original machine took roughly fifteen minutes for the complete cold replay; new-machine timing is unverified.

## 10. Collaboration and evidence rules

- Preserve dirty/unrelated work and all failed artifacts. This PR consolidates the previously uncommitted work from this same project thread; it is intentionally a large draft handoff.
- Do not claim tests, live behavior, held-out performance, survival, retention, source migration or RSI beyond what the specific artifact supports.
- Report only actual tool error fields. Opaque failures have no invented quota, HTTP, authentication or timing explanation.
- Do not hardcode a supposed finding into a script and read it back as evidence. Derived numbers must come from source data.
- Do not search a live rollout log and attribute your own query text to an external tool. Confirm event origin if doing session forensics.
- Do not silently restart/reseed extinct habitats, overwrite recovery data, auto-run old campaigns or treat a fork as offspring.
- Do not update personal memory files unless the user explicitly asks. Workspace handoff documents are the continuation record here.
- The user prefers direct execution within the authorized scope and concise updates, but asked for this PR and handoff to carry exhaustive context.

## 11. Copy/paste prompt for the next thread

> Read HANDOFF.md and docs/HANDOFF_FILE_INDEX.md in full, then docs/ASTRA_EMBODIED_RECOMMENDATION.md and the complete Astra transcript. Restore and verify the bundled evidence before audits. This is the continuation of the paused Fly Ecosystem RSI research session. Do not claim RSI, redo completed failed studies, or promote a policy. If I authorize resumption, create/resume the revised research goal and continue from the unfinished Expected SARSA embodied screen: finish and review its fresh protocol, exact probe budget, cost/debt accounting, combined checkpoints, all-founder retention comparisons and independent audits before launching performance runs. Use the current machine's actual provider/model catalog if consulting Astra. Preserve all source/evidence hashes and report real findings and failures candidly. The full source, raw evidence, paused habitat exports and all public Astra context are included in this PR; no old local chat state is required.
