# MaleCNS integration and correction

The user's requested brain is **MaleCNS v1.0**, a collaboration of HHMI Janelia FlyEM, University of Cambridge, MRC LMB, and Google Research. The previous ecosystem used a different, compact network. That substitution did not satisfy the requested model. Archived results and releases remain available but must not be described as Google-brain results.

The default `npm start` now runs `connectome/server.py`, with no compact fallback. `npm run start:legacy` explicitly runs the old system. The existing Railway Docker deployment remains legacy; this correction is not yet deployed there.

## Run

```sh
python3 -m venv .venv-connectome
.venv-connectome/bin/pip install -r requirements-connectome.txt
.venv-connectome/bin/python scripts/connectome.py prepare
npm start -- --steps 100 --founders 2 --capacity 4
```

Requires a C++17 compiler. The observer opens at http://127.0.0.1:8766. It is read-only, locally bound, and runs a bounded number of steps, then pauses and checkpoints. It does not automatically reseed. Restore with `npm start -- --restore runs/malecns/<checkpoint-directory> --steps 100`.

## Actual anatomy and model assumptions

All 166,700 source neurons and 25,582,938 directed weighted edges from the prepared min-confidence-0.5 graph are retained per individual. The graph contains 124,177,617 aggregated synaptic contacts. These are counts of this data representation, not a claim that every published contact passes its source filtering. Original download hashes are checked by `scripts/connectome.py prepare`.

The pinned Stonkfly approximate spiking kernel propagates activity across this graph; it is not a Google-authored runnable brain model. A connectome is wiring data. Every fly has independent voltage, conductance, synaptic efficacy, plasticity, and delay state. No compact network or procedural food-seeking controller provides actions.

Sensory encoding is engineered: a food-bearing panorama is projected onto inferred retinal coordinates, an explicit object detector stimulates annotated LC9 visual projection neurons, and food contact stimulates annotated sugar receptors. LC9 directly feeds the DNp09 pursuit pathway in published work. The body decoder uses bilateral DNp09 activity for forward drive, the DNp09 right-left difference for ipsilateral turning, and MN9 for feeding; DNa02 is recorded but is not mixed into the calibrated pursuit decoder. Motor-to-body gains are assumptions, not validated biomechanics. A silent motor readout produces no movement. Both reproductive roles use the same male anatomical template; sex differentiation is not modeled biologically.

Reproduction is an explicit age/proximity/energy rule, not neural courtship. Both flies must be at least 30 artificial seconds old, within 26 arena units, off cooldown, and hold at least 60 energy. That threshold was recalibrated after an uninterrupted v2 run reached maturity with the pair in range but just below the compact model's inherited 65-energy threshold. Offspring retain full anatomical topology and inherit three mutated gain parameters: LC9 visual drive, motor decoding, and plastic-edge baseline gain. Acquired memory is not copied. **Structural neural evolution is not implemented in this integration.** Population capacity is an operational memory ceiling, not a reduction in each brain's neurons.

The arena includes resource renewal, food drift, scarcity, a stress region, energy costs, death, and lineage. Durations and costs are artificial. This is not yet a demonstrated self-sustaining ecosystem or a validated learning experiment.

## Verification and limits

Run `.venv-connectome/bin/python connectome/verify.py` for real full-graph state continuation, independent state, and offspring topology tests. Run `.venv-connectome/bin/python connectome/behavior_assay.py` for the bounded LC9-to-DNp09 approach assay. See the corresponding generated files under `evidence/`. Forced offspring construction in a test is not spontaneous reproduction.

Run `.venv-connectome/bin/python connectome/reproduction_assay.py` for the
controlled eligible-pair construction test. It creates three full brain states and
therefore has a higher memory peak than the normal two-founder run.

Run `.venv-connectome/bin/python connectome/memory_assay.py` to reproduce the
local peak-memory measurement used in the hosting assessment.

The original v1 adapter produced neural activity and turning/feeding but no forward movement. The v2 calibration assay established that LC9 stimulation produces DNp09 activity, and the integration test requires resulting forward displacement. In the uninterrupted v3 run captured at tick 327, fly 3 was born at tick 300 from parents 1 and 2 with independent full-connectome state and inherited gain traits. That single birth proves the live construction path, not a self-sustaining population, learning advantage, adaptation, or biological reproduction. See `evidence/malecns-live-state.json`.

Full-brain compute and checkpoint sizes require a separate hosting assessment before replacing the Railway service. Do not deploy the existing compact Dockerfile and describe it as MaleCNS.

## Sources

- https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/
- https://male-cns.janelia.org/
- https://doi.org/10.1016/j.neuron.2020.07.032
- `vendor/stonkfly/neural/sources.lock.json` — exact original URLs and hashes
- `vendor/stonkfly` — pinned MIT runtime and explicit physiological assumptions

Data attribution and licensing remain as documented in the repository's third-party notices. Brain dynamics, arena embodiment, and inheritance rules are added models, not measured properties supplied by Google.
