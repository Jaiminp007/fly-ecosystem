# Saved motor-value diagnostic result

On 6,635 factual current-transfer decisions from the seven available histories,
the acting founders' saved A, B and C motor models prefer:

| Saved model | Stationary | Half speed | Full speed |
| --- | ---: | ---: | ---: |
| A | 1,319 | 2,459 | 2,857 |
| B | 1,076 | 2,867 | 2,692 |
| C | 2,481 | 1,659 | 2,495 |

The C model's reconstructed greedy action matches every executed frozen-current
speed. On the same recorded observations, A and C select different speeds for
4,559 decisions, and B and C differ for 3,422. In this visited-state sample,
stationary preference increases from 19.9% under A weights to 37.4% under C.
This is a descriptive preference shift, not a causal attribution to a specific
training phase, proof of forgetting, or evidence that the A/B choices would have
performed better: those alternative models did not generate these trajectories.
The eighth history lacks a C checkpoint and is not replaced.

An independent second implementation checks all 6,635 feature vectors,
greedy choices and change counts against the raw traces and own saved weights.
Source, design, anchor and tape hashes are recorded in
`evidence/own-steering-motor-diagnosis/20261026-v1`. This is outcome-informed
development evidence, not qualification or a source of counterfactual labels.
The previous fixed full-speed physical intervention supplies the separate
evidence that changing movement improved the seven observed current forks, but
it still lost one survivor against both reset and cheap native-full.

Next investigate whether the observed shift arises from the motor's factual
training rewards, bootstrapping or state distribution, using own acquisition
records and fixed controls before proposing a new learner. The original
functional-pressure, retention, transfer and fresh qualification gates remain.
