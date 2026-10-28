# Supported learner own-contact evaluation

The fixed census in `SUPPORTED_OWN_CONTACT_PLAN.md` scores saved A and B taste
models only on observed own stationary accepted contacts with nonzero
outcomes. Numbers are pooled per-contact Brier losses; lower is better.

| Recorded probe | Contacts | Saved A loss | Saved B loss | Histories B is lower |
| --- | ---: | ---: | ---: | ---: |
| A with saved A | 2,316 | 0.107605 | 0.107712 | 4/8 |
| A with saved B | 2,278 | 0.109503 | 0.110418 | 4/8 |
| B with saved A | 3,729 | 0.224174 | 0.215568 | 5/8 |
| B with saved B | 3,521 | 0.214729 | 0.230692 | 4/8 |

On these selected observations, B taste is not consistently better or worse
than A taste. In particular, B-probe losses reverse their pooled ordering
between trajectories. These are not matched full-population estimates: samples
require acceptance, stationary motion and an observable homogeneous contact,
and the action probability is not necessarily calibrated as a label
probability. Rejected and otherwise unobserved outcomes are not inferred.
The result does not establish taste's contribution to physical pressure.

Evidence: `evidence/supported-own-contact/20261026-v1`. A separate arithmetic
implementation verifies own decision/observation pairing, signed labels, model
scores and hashes for 11,844 examples. The supported development outcome
checker also independently verifies its summary arithmetic and 58,377 A-probe
physical receipts (`evidence/supported-steering-development/20261026-v1/outcomes-readback.json`).
These checks do not independently simulate physics or provide fresh evidence.

The paid taste-by-steering factorial remains the next causal diagnostic; it
cannot start below the documented 1 GiB free-space guard. Do not promote an
offline loss difference, alter gates, delete evidence, or open closed reserves.
