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

Sensory encoding is engineered: a food-bearing panorama is projected onto inferred retinal coordinates, and food contact stimulates annotated sugar receptors. Readouts use annotated DNa02 left/right for turning, DNp09 for forward drive, and MN9 for feeding. Motor-to-body gains are assumptions, not validated biomechanics. A silent motor readout produces no movement. Both reproductive roles use the same male anatomical template; sex differentiation is not modeled biologically.

Reproduction is an explicit age/proximity/energy rule, not neural courtship. Offspring retain full anatomical topology and inherit three mutated gain parameters (vision, motor decoding, and plastic-edge baseline gain). Acquired memory is not copied. **Structural neural evolution is not implemented in this integration.** Population capacity is an operational memory ceiling, not a reduction in each brain's neurons.

The arena includes resource renewal, food drift, scarcity, a stress region, energy costs, death, and lineage. Durations and costs are artificial. This is not yet a demonstrated self-sustaining ecosystem or a validated learning experiment.

## Verification and limits

Run `.venv-connectome/bin/python connectome/verify.py` for real full-graph state continuation, independent state, and offspring topology tests. See `evidence/malecns-integration.json` for generated results. Forced offspring construction in a test is not spontaneous reproduction.

The initial two-brain, 30-step run showed neural activity and turning/feeding in one individual but no forward movement in either individual. Short-run observations do not establish learning, adaptation, or successful reproduction. Full-brain compute and checkpoint sizes require a separate hosting assessment before replacing the Railway service. Do not deploy the existing compact Dockerfile and describe it as MaleCNS.

## Sources

- https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/
- https://male-cns.janelia.org/
- `vendor/stonkfly/neural/sources.lock.json` — exact original URLs and hashes
- `vendor/stonkfly` — pinned MIT runtime and explicit physiological assumptions

Data attribution and licensing remain as documented in the repository's third-party notices. Brain dynamics, arena embodiment, and inheritance rules are added models, not measured properties supplied by Google.
