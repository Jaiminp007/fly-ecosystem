# Expected SARSA screen: results and continuation

The fixed candidate **failed qualification** on the locked fresh bank. 3 of 9 required energy/skill/retention contrasts passed. The original intervention remains failed. No ecological policy was promoted and no RSI result has been demonstrated.

The user authorized continuation from PR #2 on 2026-10-24. The original handoff/Astra transcript remain preserved. See [the prospective design](SARSA_SCREEN.md) and [the frozen protocol](../evidence/sarsa-screen/20261024-fixed-expected-sarsa-v1/protocol.json).

Sixteen independent seed histories, seven arms and nine common-body probes per history: 112 main worlds plus 144 frozen probes. Each history keeps all 24 original founders in denominators. The nine-probe/144 budget was explicitly adopted before scientific seeds/outcomes; it exceeds the suggested 128-probe ceiling by sixteen, retaining the earlier 256-world combined cap. No candidate search, held-out reselection, sample extension or replacement of deaths occurred.

Every contrast below reports the mean energy effect per founder, its simultaneous one-sided lower confidence bound, exact paired sign-flip p-value and frozen gate. Bonferroni family alpha .05 covers all ten contrasts (including optional trace attribution); each requires lower > 0 and p ≤ .005. The history, not a founder or probe, is the inference unit.

- `B-acquisition`: mean 0.156389, lower -0.230172, p=0.12420654; **fail**.
- `C-acquisition`: mean -0.002480, lower -0.276774, p=0.51025391; **fail**.
- `sequence-incumbent`: mean -0.278874, lower -2.024720, p=0.67346191; **fail**.
- `sequence-fast`: mean 3.326131, lower 1.863186, p=4.5776367e-05; **pass**.
- `sequence-slow`: mean 9.247718, lower 7.375424, p=1.5258789e-05; **pass**.
- `A-initial-skill`: mean 0.370850, lower -0.071622, p=0.013519287; **fail**.
- `B-initial-skill`: mean 0.746794, lower 0.321292, p=7.6293945e-05; **pass**.
- `A-retention`: mean 0.361250, lower -0.188895, p=0.034912109; **fail**.
- `B-retention`: mean -0.070247, lower -0.561621, p=0.66072083; **fail**.
- `trace-contribution`: mean 1.119375, lower -0.333463, p=0.021148682; **fail** (optional attribution).

Passed comparisons: sequence-fast, sequence-slow, B-initial-skill. Failed comparisons: B-acquisition, C-acquisition, sequence-incumbent, A-initial-skill, A-retention, B-retention, trace-contribution. A positive average alone does not clear a gate. Trace attribution requires the separate optional lambda-zero comparison.

Whole-sequence mean net energy change per founder (including priced external work/debt):

- candidate: -12.188255.
- lambda0: -13.307630.
- frozen: -13.287683.
- reset: -12.278170.
- incumbent: -11.909381.
- fast: -15.514386.
- slow: -21.435974.

Survival guards require nonnegative observed mean candidate-control survival, with descriptive uncertainty. They are not a survival noninferiority demonstration:

- Versus incumbent: -0.520833 percentage points, descriptive 95% interval [-1.279196, 0.237530]; **fail**.
- Versus fast: 0.260417 percentage points, descriptive 95% interval [-0.722116, 1.242950]; **pass**.
- Versus slow: 0.000000 percentage points, descriptive 95% interval [-1.146537, 1.146537]; **pass**.
- Versus frozen: -0.260417 percentage points, descriptive 95% interval [-1.242950, 0.722116]; **fail**.
- Versus reset: -0.520833 percentage points, descriptive 95% interval [-1.279196, 0.237530]; **fail**.
- Versus lambda0: 0.520833 percentage points, descriptive 95% interval [-0.853817, 1.895483]; **pass**.

Survivor totals across the sixteen main worlds:

- candidate: 382/384.
- lambda0: 380/384.
- frozen: 383/384.
- reset: 384/384.
- incumbent: 384/384.
- fast: 381/384.
- slow: 382/384.

Actual memory pressure was present: candidate founders completed 219–223 transitions against a 64-transition capacity; 203–207 transitions entered the older-reservoir stream. These are observed lifetime counters, not proof that each retained record supplied a distinct useful skill.

Actual candidate resource measurements, averaged over histories:

- A: inventory 253.892472 → 317.120891, eaten 470.602433, delivered regrowth 533.830852.
- B: inventory 317.120891 → 383.237712, eaten 476.220106, delivered regrowth 542.336928.
- C: inventory 383.237712 → 239.557608, eaten 421.386512, delivered regrowth 277.706407.
- return-A: inventory 239.557608 → 297.754664, eaten 214.919932, delivered regrowth 273.116988.

Collection consumed 233.933286 measured wall seconds and 233.609000/10.781000 process user/system CPU seconds on Node v22.19.0 / Windows. This includes external recording/evaluation overhead; it is separate from the declared canonical-storage/scalar-work energy model.

The full original cold audit reproduced all 112 main worlds and 144 probes, including physical/checkpoint/learner states, endpoints, scores and gates. The first independent Python audit stopped on `AssertionError: factual prior features`. Investigation found that a death on a decision tick can perform two learner updates, while the original evaluator trace stored only the last one. The original frozen sources, traces, results and failed log remain intact.

A supplemental recorder captures both updates in their actual order. It cold-replayed the same bank again and asserted exact equality of every original main/probe/checkpoint/learner/endpoint row. It recorded 2 double-update events. It changed no scientific seed, learner rule, physical trajectory, score, contrast or gate. The source manifest and patch identify the correction; no authoritative original bytes were rewritten.

The corrected independent Python checker rebuilt 280,266 factual transitions and 344,000 choices across 1,536 learner bodies, plus history features, RNGs, traces, reservoir/replay, scalar work, paid/debt arithmetic, all-founder endpoints and all ten statistical gates. V2 completed those arithmetic assertions but refused the warning-free gate because it left sixteen trace files unclosed. V3 adds explicit file context managers; its source/patch and both earlier failures are preserved. V3 passed with 0 warnings. No arithmetic threshold changed. This independent arithmetic complements the physical replay; it does not turn a failed scientific gate into a pass.

New-machine preparation restored and verified all 1,316 original archived files and installed 17 paused runtime files without starting habitats. Windows CRLF conversion initially caused an exact evidence-hash refusal; confirmed line-ending-only files were restored to their original Git blob bytes, and `.gitattributes` prevents recurrence. The historical loader test now uses Windows-compatible file URLs. The prior intervention numerical audit passed here with 64 models, twelve comparisons and no warnings; its historical full physical bank was not rerun here.

An intermediate baseline suite reported an autonomy smoke-test status error without the child error in its assertion. The assertion now retains that error. A later run exposed `EPERM` during replacement of `status.json.tmp` with `status.json` on Windows. The existing autonomy runner now retries that same completed temporary file a bounded number of times, preserving the old checkpoint and propagating a persistent error. Regression tests cover eventual success and persistent failure without deleting either recovery file. The earlier uninstrumented failure has no separately established cause. Failing logs remain preserved. Initialization also initially refused a missing parent directory (`ENOENT`); the parent is now created before the exclusive study directory. This occurred before seeds/outcomes were generated.

The entire new bank, original and corrected traces, captured source graphs, seed exclusion inputs, all audits and execution logs are retained in the additional checked archive. The original handoff manifest/chunks remain unchanged. Restore after cloning:

```powershell
python scripts/research-evidence.py restore --runtime
python scripts/package-sarsa-evidence.py restore handoff/sarsa-screen-20261024/manifest.json
python scripts/package-sarsa-evidence.py verify handoff/sarsa-screen-20261024/manifest.json
```

The RSI goal remains active and unachieved. This candidate is not a qualified embodied substrate, so it does not authorize advancing it to persistent recursive generations or a live habitat. Any next candidate requires a justified change and a new prospective protocol/bank; these held-out outcomes cannot be reused for selection or called fresh confirmation. Copied-improvement controls, successive autonomous algorithm revisions and causal search-productivity gains remain unimplemented obligations.
