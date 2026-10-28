# Decoupled cue residual: fixed offline screen passed

The matched learners received the same 26,956 provenance-verified own
examples. Both computed and updated the same shared weights and cue-specific
residuals; only the prediction mask differed. Their complete stored states,
RNG, work and encoded sizes are identical within each paired checkpoint.

| Corpus | Mean B log-loss improvement | Positive histories | Mean A-at-C log-loss change |
| --- | ---: | ---: | ---: |
| Original | +0.012065 | 8/8 | -0.102938 |
| Adjacent conflict | +0.022438 | 8/8 | -0.132578 |

Positive B improvement means lower B loss, and negative A change means lower A
loss. The fixed offline gate passes in both corpora, but most B improvements
are small and the corpora reuse seeds and survivor-selected factual histories.
Among 488 B cue evaluations, 398 have no own matching example and their
residual remains zero; paired shared predictions are identical there. This is
not a physical intervention, proof of acquired skill or qualification.

Four focused tests pass. Independent readbacks reconstruct 26,956 own examples,
107,824 updates, RNG, stores, encoded state and evaluator scores, and verify
366 paired checkpoints and all 398 unseen residuals. Source, protocol, rows
and readbacks are in `evidence/decoupled-cue-offline/20261026-v1`; the prior
support census is in `evidence/cue-residual-support/20261026-v1`.

The next required step is a fully priced physical acquisition comparison with
matched shared-only and shared-plus-cue control access on the original
curriculum; inference, initialization, copies, memory, terminal work and debt
must all be billed. The offline pass does not authorize opening a closed reserve
or relaxing any functional-pressure, retention, transfer or fresh-audit gate.
