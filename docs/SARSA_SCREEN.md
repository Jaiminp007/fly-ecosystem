# Fixed Expected SARSA embodied screen

The user authorized continuing PR #2 on 2026-10-24. The prior intervention remains failed. This screen implements the next stage in [Astra's recommendation](ASTRA_EMBODIED_RECOMMENDATION.md); no policy has been promoted.

The fixed candidate uses the existing speed levels and steering scaffold, current plus three previous own decisions, Expected SARSA(λ=.9), ε=.1, γ=exp(-duration/256), live rate .05 and replay rate .01. Each body has 16 recent and 48 reservoir transitions. No task labels, fork outcomes or cross-founder training. The matched λ=0, frozen-after-A, acquired-reset-at-B/C and fixed-speed controls disable both native acquisition paths. The original incumbent remains a separately disclosed reference.

Sixteen fresh independent histories each have seven 1,792-tick main worlds: A512 → moving B512 → lower-renewal C512 → return-A256. There are nine 256-tick probes per history, all from common end-C candidate bodies and unseen family resource seeds. A compares saved-A/current-C/reset; B compares saved-A/saved-B/current-C/reset; C compares saved-B/current-C. All original 24 founders remain in denominators, including deaths. Transient history/traces/pending outcomes are cleared for probes, acquisition freezes, and prospective charges reset. Main policies never receive probe feedback.

Before generating scientific seeds or outcomes, the complete nine-probe matrix was chosen explicitly: **112 main worlds + 144 probes = 256 worlds**, at most 237,568 world steps. This changes Astra's suggested 128-probe ceiling by sixteen, to preserve every required acquisition and retention/reset comparison, while retaining the earlier 256-world combined cap. There are no development performance runs or candidate selection.

The primary endpoint is usable survivor energy minus initial founder energy and unpaid external computation debt, divided by 24. Paid costs already reduce physical energy. Declared canonical encoded storage and scalar-operation prices are separate from wall/CPU measurements. Legacy native charges remain; shared physical/scaffold work is common. Recorder, immutable saved evaluation snapshots and checkpoint/cold-replay work belong to the external evaluator, never to the learner's accessible memory. Frozen probes retain each model's priced replay state; reset probes clear it. Numerical events record actual main-run choices and transitions for independent arithmetic; their feedback is not accessible to a fly.

Ten prespecified one-sided contrasts share Bonferroni α=.05 (α=.005 each), including optional trace attribution. Each requires a positive Student-t simultaneous lower bound and an exact paired sign-flip p≤.005, using independent histories as units. Normal seed-mean and symmetric paired-effect assumptions apply. Required contrasts are B-acquisition (saved-B minus saved-A in B), C-acquisition (current-C minus saved-B in C), whole-sequence energy over incumbent/fast/slow, earlier A/B skill over reset, and separate A/B retention. The retention contrast is `(current − reset) − .95 × (earlier − reset)`; a positive initial learned advantage is separately required. Survival guards require no negative observed mean effect against incumbent, both constants, frozen, reset and λ=0; descriptive intervals are reported. This guard does not establish survival noninferiority or benefit. Trace attribution additionally requires the λ=0 energy contrast.

Every captured import is executed from the frozen source directory. The runner checks the entire restored evidence manifest before initialization, scans restored protocol seed registries recursively, and conservatively excludes every integer literal in current unit tests. All 128 new world/resource/probe seeds are distinct. Protocol, source, registry, engineering-source, row and numerical-log hashes are retained. Output files are exclusive; partial/failed artifacts are never overwritten to retry. Main worlds record per-phase actual inventory, eaten food and delivered regrowth; a reduced renewal setting alone does not prove scarcity. Joint checkpoints and every reported result are cold-replayed by Node. A separately implemented Python audit rebuilds factual features, action RNG/choices, online traces, replay/reservoir updates, scalar work, debt arithmetic and all statistical gates.

The final transition in a phase matures at the next decision unless death ends it. Saved phase snapshots therefore contain only matured updates; resets at B/C drop pending transitions. Late terminal work remains debt in the endpoint. This timing is fixed before outcomes, not adjusted after seeing skill comparisons.

Any required gate failure records this candidate as failed. No resampling, held-out reselection, larger sample or quiet deployment follows. A pass supplies a bounded embodied substrate only. Persistent algorithm generations, copied-improvement controls and demonstrated recursive productivity remain subsequent obligations.

Commands (run from the repository root; replace DIRECTORY with the newly initialized evidence directory):

The new checker requires Python 3.10+ and was verified here with Python 3.11.9, NumPy 2.4.6 and SciPy 1.17.1. The older handoff's Python 3.9.6 reference describes its historical run.

```powershell
node scripts/sarsa-screen.mjs init DIRECTORY .venv-research/Scripts/python.exe
node DIRECTORY/sources/scripts/sarsa-screen.mjs collect DIRECTORY
node DIRECTORY/sources/scripts/sarsa-screen.mjs score DIRECTORY
node DIRECTORY/sources/scripts/audit-sarsa-screen.mjs DIRECTORY
.venv-research/Scripts/python.exe DIRECTORY/sources/scripts/audit-sarsa-screen.py DIRECTORY DIRECTORY/numeric-audit.json
```

The pre-freeze source review checked registered identities, captured-source execution, all-founder and extinction behavior, exact contrast signs, probe budget, hidden acquisition, own-history chronology, reset/freeze differences, common probe bodies and unpaid terminal work. Engineering tests include an independent Python reconstruction of a complete synthetic four-founder screen. This is root source review plus independently implemented numerical verification; it is not a new Astra consultation or an independent human/model review.

The completed screen failed. See [the results](SARSA_SCREEN_RESULTS.md) for exact gates, two unchanged physical replays, the preserved evaluator-recorder correction and the final warning-free numerical audit. The recorded original protocol and source bytes remain authoritative; supplemental corrected trace/checker sources are separately fingerprinted.
