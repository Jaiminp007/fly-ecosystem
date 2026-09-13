# Validation record

Engine SHA-256: `d029c829ec5fb20eae9e152691b27d72fe225135f976cc99d80143907e4cfb20`. Results match the packaged engine.

Independent seeds; fixed 20000-tick requested horizon unless TICKS overridden. No reseeding. Comparisons descriptive; not proof of learning or intelligence. Timings are local observations, not isolated hardware benchmarks.

| Treatment | Seed | Final population | Births | Deepest ancestry | Mean living neurons | Outcome | Measured speed |
|---|---:|---:|---:|---:|---:|---|---:|
| learning + mutation | 7 | 59 | 421 | 25 | 70.4 | running | 83.3× |
| learning + mutation | 23 | 69 | 447 | 25 | 73.6 | running | 73.1× |
| learning + mutation | 111 | 69 | 411 | 26 | 71.0 | running | 86.9× |
| frozen lifetime weights | 7 | 54 | 422 | 28 | 64.8 | running | 78.4× |
| frozen lifetime weights | 23 | 51 | 394 | 23 | 58.4 | running | 80.1× |
| frozen lifetime weights | 111 | 53 | 416 | 24 | 59.7 | running | 87.3× |
| no inherited mutation | 7 | 32 | 360 | 25 | 30.0 | running | 96.3× |
| no inherited mutation | 23 | 52 | 374 | 24 | 30.0 | running | 104.1× |
| no inherited mutation | 111 | 45 | 385 | 24 | 30.0 | running | 98.5× |
| low resources | 7 | 0 | 16 | 3 | 0.0 | extinct | 219.8× |
| low resources | 23 | 0 | 15 | 2 | 0.0 | extinct | 202.1× |
| low resources | 111 | 0 | 19 | 2 | 0.0 | extinct | 182.6× |

Maximum absolute energy-accounting residual: 8.978531695902348e-9 energy units.

The richer habitat sustained all tested populations, including frozen-learning controls. This does not establish a learning advantage. All low-resource populations became extinct without reseeding. These are artificial world seconds, not calibrated biological time. Default resource availability and founder food-seeking scaffolding were selected during development.

## Full-connectome assay

Retained neurons: 166700; directed edges: 25582938; synaptic contacts: 124177617. Synthetic stimulus duration: 100 neural ms; measured wall time: 0.25944549997802824 seconds, excluding 13.744543041975703 seconds loading. Strict numeric checks: true. NumPy: 2.3.5. Changed plastic edges: 3. This demonstrates execution and weight changes, not functional learning or biological accuracy. The graph is not the controller of the reproducing ecosystem.

The initial system-Python/NumPy 2.0.2 assay emitted numerical warnings and failed when configured to raise on invalid numerical operations. A separate Python environment with NumPy 2.3.5 passed; the underlying cause was not established. Vendored neural code was not patched. See environment.json for versions.

## Checks and limitations

See tests.txt for actual automated test output. JavaScript syntax and static DOM references were checked, and the local HTTP interface was exercised. Browser visual/interaction QA and supported-browser WebMCP verification were not performed. No claim of consciousness, civilization, unlimited brain growth, nested simulations or increased intelligence is supported.
