# Local tile-coded SARSA: development result

The fixed new hypothesis **failed its prespecified development screen**. 7 of 11 required contrast means were positive; 5 of 8 survival guards passed. Development never supplies qualification. Confirmation output exists: **False**. The earlier intervention and linear SARSA qualification remain failed; no RSI result or policy promotion is claimed.

The user-directed research goal remains active. [The prospective design](LOCAL_TILE_DEVELOPMENT.md) and [frozen protocol](../evidence/sarsa-screen/20261024-local-tiles-development-v1/protocol.json) specify one representation hypothesis, not a candidate library or a post-result tuning round.

Eight fresh histories supplied 72 main worlds and 144 frozen probes (216 total). Sixteen distinct confirmation histories were reserved before outcomes. The combined development/conditional-confirmation cap is 504 worlds / 460,800 world steps. The failure rule bars confirmation, parameter tuning, reselection and sample extension on this bank.

Each contrast below is an energy effect per original founder. Development uses positive means as a go/no-go screen; displayed bounds and exact paired sign-flip probabilities are descriptive here. They do not reclassify this bank as confirmation. The frozen confirmatory rule requires positive simultaneous lower bounds and p≤.05/12 on a separate bank.

- `B-acquisition`: mean -0.256198, simultaneous lower -0.984588, p=0.8984375; mean **not positive**.
- `C-acquisition`: mean -0.068352, simultaneous lower -0.513487, p=0.6640625; mean **not positive**.
- `sequence-incumbent`: mean -0.487971, simultaneous lower -3.060684, p=0.75390625; mean **not positive**.
- `sequence-fast`: mean 2.418847, simultaneous lower 0.718045, p=0.00390625; mean **positive**.
- `sequence-slow`: mean 8.877518, simultaneous lower 3.877382, p=0.00390625; mean **positive**.
- `A-initial-skill`: mean 0.950769, simultaneous lower 0.313466, p=0.00390625; mean **positive**.
- `B-initial-skill`: mean 0.540304, simultaneous lower -0.299564, p=0.01171875; mean **positive**.
- `A-retention`: mean 0.377449, simultaneous lower -0.016642, p=0.0078125; mean **positive**.
- `B-retention`: mean 0.090129, simultaneous lower -0.551625, p=0.3125; mean **positive**.
- `sequence-linear`: mean -0.093191, simultaneous lower -2.209488, p=0.5625; mean **not positive**.
- `sequence-reflex`: mean 1.854330, simultaneous lower -2.281959, p=0.0703125; mean **positive**.
- `trace-contribution`: mean 0.484048, simultaneous lower -3.172274, p=0.33203125; mean **positive** (optional trace attribution).

Survival differences are candidate minus control, in percentage points. These observed-mean guards and descriptive intervals do not establish a survival benefit or noninferiority:

- incumbent: 0.000000, descriptive 95% interval [-1.861967, 1.861967]; **pass**.
- fast: 0.520833, descriptive 95% interval [-1.711586, 2.753253]; **pass**.
- slow: 0.000000, descriptive 95% interval [-1.861967, 1.861967]; **pass**.
- frozen: 0.000000, descriptive 95% interval [-1.861967, 1.861967]; **pass**.
- reset: -0.520833, descriptive 95% interval [-1.752408, 0.710742]; **fail**.
- lambda0: -0.520833, descriptive 95% interval [-1.752408, 0.710742]; **fail**.
- linear: 0.520833, descriptive 95% interval [-0.710742, 1.752408]; **pass**.
- reflex: -0.520833, descriptive 95% interval [-1.752408, 0.710742]; **fail**.

Observed whole-sequence energy change per founder, and actual incurred external model charges per founder:

- candidate: net energy -12.913737; incurred external charge 0.979241; survivors 191/192.
- lambda0: net energy -13.397785; incurred external charge 0.978865; survivors 192/192.
- frozen: net energy -13.052479; incurred external charge 0.832534; survivors 191/192.
- reset: net energy -12.820089; incurred external charge 0.775166; survivors 192/192.
- incumbent: net energy -12.425767; incurred external charge 0.000000; survivors 191/192.
- fast: net energy -15.332585; incurred external charge 0.000000; survivors 190/192.
- slow: net energy -21.791255; incurred external charge 0.000000; survivors 191/192.
- linear: net energy -12.820547; incurred external charge 0.744847; survivors 190/192.
- reflex: net energy -14.768067; incurred external charge 0.008657; survivors 192/192.

Charges affected live energy, rewards and trajectories. Adding them back would not measure a zero-price counterfactual. Legacy native controller prices remain separate from these external-program charges. The fixed feeding reflex is a human reference, not a learned policy.

The previous linear candidate supplies a separately recorded developmental reference:

- `B-acquisition`: mean 0.074070.
- `C-acquisition`: mean -0.064790.
- `sequence-incumbent`: mean -0.394780.
- `sequence-fast`: mean 2.512038.
- `sequence-slow`: mean 8.970708.
- `A-initial-skill`: mean 0.817052.
- `B-initial-skill`: mean 0.777202.
- `A-retention`: mean -0.032274.
- `B-retention`: mean 0.187352.

These linear means are diagnostic comparisons on fresh development data, not a new qualification result. Their shared incumbent/constant physical rows are identified explicitly; tile frozen/reset arms are not presented as matched linear ablations.

The full physical audit cold-replayed every registered development world, probe, state/checkpoint hash, factual trace and score. Independent Python reconstructed 182,943 factual transitions, 214,992 learned-policy decisions and 43,008 fixed-reflex decisions across 960 learner bodies, then checked all twelve contrasts and the decision rule. It passed with 0 warnings. The checker separately implements sparse feature quantization/hashing/collisions, normalization, action RNG, traces, reservoir and replay arithmetic; it does not import JavaScript scoring.

Collection wall time totaled 198.770731 measured seconds, including evaluator recording/checkpoint overhead. Original failed-bank seeds and all reserved new world/resource/probe seeds are disjoint. The captured graph includes 37 source files, 64 prior registries and 42 engineering-test sources. The default linear implementation still exactly matches the original captured experiment on the declared engineering seed; this is code compatibility, not cross-platform proof.

A separate historical intervention portability check was also attempted without changing original bytes. The original strict auditor stopped on Windows/Node 22 at its first recorded development world. An independently captured diagnostic compared that same world under Windows Node 22.19.0 and the recorded Node 26.5.0 version, downloaded from the official distribution and SHA-256 verified. Both Windows runtimes produced byte-identical regenerated row files, but neither exactly matched the Mac-recorded row.

That one world contains 32 scheduled cases / 16,384 fork steps. Across 2,914 numeric fields, 630 differed, with maximum absolute difference 4.42697434266e-10; 161 hashes differed. All natural choices matched in this one world. The maximum difference among its 128 energy outcomes was 1.38200562105e-11. These are descriptive differences, not a substituted tolerance or a whole-bank agreement claim. Matching Node versions did not resolve the discrepancy; the exact cross-platform cause remains unestablished. The original strict Windows audit remains failed and its log, both regenerated rows, source and checksum provenance are preserved. The original numerical audit of recorded data remains distinct from physical portability.

The complete new raw bank, reserved seed identities, original frozen source graph, exclusion inputs, numerical/physical audits and portability artifacts travel in an additional checked archive. No earlier archive is rewritten. The prior study source/report text remains historical context, and these new findings amend the current interpretation rather than editing a recorded result.

The next research action must address why continuing updates fail to establish new B/C skill and incumbent superiority. Nonlinear local features alone did not clear even the developmental screen. This does not prove every nonlinear representation or Expected SARSA variant fails. The earlier [32-seed neural/episodic factorial](NEURAL_MEMORY_INTERACTION.md) already failed to support a remaining-neural-output interference explanation; it must not be repeated unchanged or presented as a new cause. The open mechanisms are temporal-credit/bootstrapped-target quality and interference during actual continuing learning, under the same embodied obligations. Any credit-target revision must use only matured own factual experience and a new prospective bank. If control scope is later broadened, all acquired components must be explicitly owned, priced, checkpointed, frozen/reset and probed; simply enabling background acquisition would invalidate the controls. These are unresolved hypotheses, not a selected winning algorithm.

Qualified continuing embodied learning and retained skills remain unachieved. Persistent autonomous algorithm revisions, acquired-state migration, copied-improvement controls and causal subsequent search-productivity gains are still required. The program registry is engineering groundwork, not evidence of any such revision or RSI.
