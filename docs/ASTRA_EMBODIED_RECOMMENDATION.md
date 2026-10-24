# Astra: next embodied candidate after the failed intervention

Source: [existing review thread](t3-thread://v1/mcp:1c9455cc-ca9f-4a5b-9ce3-5195a55afb00). Completed 2026-10-24T05:04:17.340Z. Run `run:thread:mcp%3A1c9455cc-ca9f-4a5b-9ce3-5195a55afb00:ordinal:5`. This is the complete read-only review response. Recommendations are new hypotheses, not performance findings.

---

**My recommendation is one speed-only, decision-level Expected SARSA(λ) learner with a bounded transition-replay memory. Do not advance the current conditional/256-window kernel learner into qualification unchanged.** Change temporal credit and how retained experience is used; keep the motor choices and steering scaffold fixed.

This is a new candidate hypothesis, not a winner established by the intervention study.

The diagnostic supports that choice of scope. From its recorded outcomes, the hindsight chooser exceeds fast-first-action by **1.122 energy in stable worlds and 1.081 in relocation worlds** at 256 ticks. Both speed choices frequently win. However, that chooser knows the realized future: **useful headroom accessible from the permitted observations remains unproven**. The paired-label reference also fails to show a consistent solution across environments. There is therefore room to investigate speed control, but no evidence yet that adding steering or more actions would solve the bottleneck. The uniform-over-observational effects—approximately **0.00194 and 0.00773**, both failing their gates—provide no advancement case for IPW. [Results](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/evidence/intervention-study/20261024-assignment-history-horizon-v1/results.json)

**The single candidate should be:**

- A small parameterized two-action value function using a fixed, normalized version of the permitted current-plus-three-decision-history features.
- An ε-greedy policy with ε = 0.1 and the existing slow/fast levels.
- One actual eight-tick transition per decision: observation/history, executed action, net energy change including charges, next observation/history, and terminal status.
- Expected SARSA updates, with decision discount \( \gamma=\exp(-8/256) \), online eligibility traces with \( \lambda=0.9 \), and zero terminal bootstrap.
- One fixed replay update per completed decision, using a **64-transition, task-blind buffer: 16 recent transitions plus 48 reservoir-sampled older transitions**. Replay refreshes the one-step target from the current value function; it does not replay eligibility traces across unrelated records.
- No phase ID, privileged fork outcomes, cross-founder sharing, kernel selection, or propensity correction.

Freeze one update-rate configuration after engineering checks. The proposed discount and trace settings are design choices, not fitted findings.

This differs materially from the earlier unsuccessful “expected TD” episodic variant: that variant stored bootstrapped values for retrieval. Here, factual transitions repeatedly update a parameterized value function, and online traces propagate credit across decisions. The earlier failure remains relevant; it does not validate this candidate. [Earlier expected-target study](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/docs/EPISODIC_CONTEXT_VALUE.md:18)

**Four corrections are needed before an embodied performance campaign.**

1. **Remove hidden incumbent acquisition from candidate and matched ablation arms.**  
   `stepEmbodiedControl` forces the selected speed but still executes `episodicActorStep`. Unless the runner explicitly disables them, incumbent episodic acquisition and the remaining neural-output learning continue. The external learner’s freeze/reset functions affect neither. That would compromise “64-record learner” and learning-disabled comparisons. Disable those acquisition paths consistently in the candidate, its ablations, and matched fixed-action controls. Run the legacy incumbent separately as an explicitly different reference. [Adapter](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/learning/embodied-control.mjs:11)

2. **Replace delayed 256-tick labels and FIFO-only retention in the candidate.**  
   With the current schedule, the first 256-tick label arrives halfway through A; many later labels span a regime boundary. These are valid experienced outcomes, but poor units for attributing acquisition of a particular phase’s skill. The ridge learner also contains no persistent fitted knowledge independent of its retained records: once A records leave FIFO, there is no explicit A rehearsal. Use the decision-transition mechanism above and preserve the existing module as an unqualified prototype. [Current acquisition and storage](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/learning/own-experience-learner.mjs:45)

3. **Complete joint checkpointing and cost accounting.**  
   A qualifying checkpoint must contain the world, every external learner, resource-transition state, exploration RNGs, eligibility traces, replay state and any outstanding computation charges. Separate exact-continuation tests do not establish exact continuation of that combination. The adapter currently defaults to zero price; make the campaign’s charging rule explicit and mandatory. Charge actual storage, inference, live updates and replay, including work performed after energy feedback. Do not describe record count alone as total memory. [Price hook](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/learning/embodied-control.mjs:5)

4. **Treat return-A as a transfer test, not sufficient retention evidence.**  
   The phase module preserves energy and bodies, but independently relocates existing food at entry. Within B, only renewal centers move. These are legitimate disclosed interventions; they do not guarantee distinct skills or that C’s existing food inventory is immediately scarce. Record actual resource inventories and delivered regrowth. Use independent frozen probes to establish retained A and B behavior on matched physical states. [Regime construction](/Users/jaiminpatel/.t3/scratch/2026-10-21-clone-this-github-repo-start-d28b3a85/learning/continual-regimes.mjs:13)

**Use one fresh matched screen, with no candidate search.**

Keep the proposed A512→B512→C512→return-A256 schedule. Use **16 fresh seed histories** and seven main arms:

1. The fixed candidate.
2. The same learner with λ = 0, retaining the same replay configuration.
3. The candidate frozen after A.
4. The candidate with acquired state reset at entry to B and C.
5. The incumbent reference.
6. Always fast.
7. Always slow.

All experimental arms should share bodies, resource schedules, permitted observations and non-speed controller settings. Prices should reflect their actual work. That is **112 main worlds**. Allow at most **128 additional 256-tick frozen probe runs**, with their seeds and comparisons fixed beforehand.

For new-skill attribution, compare learned and frozen learner states in common B and C probe bodies. Raw phase-end energy alone can carry advantages from earlier phases. For retention, compare saved end-A/end-B states with end-C states on the same unseen A/B probe configurations, with matched physical states and random streams and acquisition disabled. Probe outcomes must never return to training. Keep all original founders in reporting and handle deaths explicitly rather than selecting survivors.

Predeclare these gates:

- Positive simultaneous seed-level confidence bounds for B and C acquisition over the appropriate frozen controls.
- Positive whole-sequence energy advantage over the incumbent and both constant-speed controls.
- Earlier skills must first show an advantage over reset. After C, retain at least **95% of that learned advantage**, assessed with paired noninferiority bounds separately for A and B. That tolerance is a proposed new-protocol choice, not an alteration of any previous gate.
- No negative mean survival effect versus the required controls; report uncertainty explicitly and do not claim a survival benefit from equal observed counts.
- Claim an eligibility-trace contribution only if the λ = 0 comparison supports it.

**If any required qualification gate fails, this candidate fails.** Do not select another method from the same held-out results or expand the sample. A pass establishes a bounded embodied learning-and-retention substrate; autonomous algorithm revision and recursive improvement remain subsequent, unachieved obligations.

The independent numerical audit is present and reports passing checks. The full physical audit artifact was not yet present when I inspected the directory. I ran no simulations or tests.
