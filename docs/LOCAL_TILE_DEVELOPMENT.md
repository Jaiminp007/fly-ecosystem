# One prospective local-feature hypothesis

The completed [linear Expected SARSA screen](SARSA_SCREEN_RESULTS.md) remains failed. Its confirmation outcomes will not become development evidence or be reclassified as fresh confirmation. The active RSI objective still requires qualified continuing embodied learning, distinct-task retention, successive autonomous algorithm revisions and a causal improvement in subsequent search. This new study addresses the missing embodied substrate only.

The source audit establishes one precise representation limit: the old greedy speed boundary is the sign of `(w_fast − w_slow)·raw`. Dividing the raw vector by its positive L2 norm does not add nonlinear action boundaries. This is not proof that representation caused the ecological failure. It motivates one fixed, falsifiable new hypothesis: local sensor/history conjunctions may support useful decisions and reduce broad parameter interference. General SARSA convergence claims do not validate this finite, partially observed, replaying controller; see the [primary linear-SARSA convergence analysis](https://proceedings.mlr.press/v202/zhang23al.html) for its separate assumptions and limits. No theoretical guarantee is claimed here.

The new `tile-sarsa-v1` retains Expected SARSA, ε=.1, λ=.9, decision discount exp(-duration/256), live rate .05, replay .01 and the 16-recent/48-reservoir factual memory. Four predetermined conjunction groups use permitted own observations/history: food bearing/proximity/energy/previous food; lateral food and wall receptors; proximity/current-to-previous change/previous action; and energy/history means/scent. Four shifted tilings per group with four bins per coordinate hash into 256 parameters per action. Collisions aggregate; sparse feature vectors have unit L2 norm. Age, clock, phase, coordinates, hidden food inventories and counterfactual outcomes are excluded. No settings will be tuned after development outcomes.

All parameter/trace/history/sparse-replay/RNG/pending/accounting state is canonically storage-priced. Quantization, hashing, normalization, inference, live and replay arithmetic have declared recorded operation counts. These model prices remain distinct from CPU/wall measurements. More parameters are not free. The fixed feeding reflex uses only the current last-food receptor: slow after food, otherwise fast. It is explicitly a human reference, with one modeled comparison per decision plus its persistent state charged; it is never credited as learning.

Eight fresh development histories compare seven tile main arms (candidate, λ=0, frozen after A, reset at B/C, legacy incumbent, fast, slow), one old-linear candidate and one fixed feeding reflex. Both learned candidates get the full nine-probe matrix; all 24 original founders remain in denominators. This is 72 main worlds plus 144 probes, totaling 216. The linear reference's frozen probes share its own end-C physical states, not the tile program's; its incumbent/constant comparisons reuse the explicitly identified physical control rows rather than invent additional worlds or matched linear ablations.

Sixteen further histories are reserved before any outcome. Confirmation, if allowed, uses the same nine main worlds per history and nine tile probes: 288 worlds. The combined collection cap is **504 worlds**, below a declared 512-world ceiling, at most 460,800 world steps. This is an explicit new development-plus-confirmation budget; the earlier 256-world failed screen is not rewritten. Cold audits repeat computation on the same sample and are timed separately, never counted as new statistical units.

Development advances only this exact candidate if all eleven required contrast **means** are positive and all eight observed mean survival guards are nonnegative. This includes the old nine energy/acquisition/initial-skill/separate 95%-retention contrasts, plus sequence energy over the previous linear candidate and feeding reflex. Development reports uncertainty and exact sign-flip probabilities, but supplies no qualification claim. There is no selection among a parameter library. A failure closes this development candidate; do not tune, expand, reselect or run confirmation on the failed bank.

Only after a promising development result and passing full physical and independently implemented numerical audits may the runner access the sixteen reserved confirmation histories. Source/configuration remain unchanged. Confirmation requires positive simultaneous one-sided Student-t lower bounds and exact paired sign-flip p≤.05/12 for all eleven required contrasts. The twelfth comparison is optional eligibility-trace attribution. Histories are independent units; the normal seed-mean and symmetric paired-effect assumptions are disclosed. Each earlier skill must separately beat reset and retain at least 95% of its learned advantage. Eight survival guards retain their observed-mean criterion and descriptive intervals; they are not a demonstrated survival benefit or noninferiority result.

The A512→B512→C512→return-A256 sequence, body lifetimes, controls, physical resource conservation, actual inventory/regrowth measurement, all-founder death treatment, saved-state maturity and late/terminal debt rules are unchanged. Frozen probes never train main learners. A lower renewal setting alone is not labeled immediate scarcity. The default linear experiment has an exact checkpoint-equality test against its original captured implementation; all original artifacts remain untouched.

The complete source graph, previous seed registries (including the failed SARSA bank), engineering-test sources and conservative test-integer exclusions are frozen before fresh seed generation. Every world/resource/probe seed across development and reserved confirmation is unique and excluded from those prior inputs. Captured entrypoints, exclusive outputs, exact row identities, all-update recording including same-tick death, full cold replay and independent Python feature/RNG/update/replay/scoring arithmetic are mandatory. This is root design/source review and an independently implemented checker, not a new Astra consultation.

Commands from the repository root:

```powershell
node scripts/sarsa-development.mjs init DIRECTORY .venv-research/Scripts/python.exe
node DIRECTORY/sources/scripts/sarsa-development.mjs collect DIRECTORY development
node DIRECTORY/sources/scripts/sarsa-development.mjs score DIRECTORY development
node DIRECTORY/sources/scripts/sarsa-development.mjs audit DIRECTORY development
.venv-research/Scripts/python.exe DIRECTORY/sources/scripts/audit-sarsa-development.py DIRECTORY development DIRECTORY/development/numeric-audit.json
# Confirmation is rejected unless development and both audits pass.
node DIRECTORY/sources/scripts/sarsa-development.mjs collect DIRECTORY confirmation
```

Even a confirmation pass would establish only a bounded embodied substrate. The program registry/checkpoint dispatch is engineering groundwork for meaningful executable changes, not an autonomous revision or a copied-improvement experiment. Those full-goal obligations remain unachieved.

The development bank has now completed and failed. See [the complete outcome](LOCAL_TILE_RESULTS.md). The sixteen reserved confirmation histories were not run. Original protocol, source, outputs and failure rules remain intact.
