# Joint steering and speed: qualification rejected

Completed 2026-10-23T22:05:17.713Z. The locked candidate **joint-local-turn0.25** failed its full qualification. Preserve this experiment and its failed outcomes; do not adopt the candidate, extend the held-out seed set, or raise environmental difficulty on this evidence.

[Results](../evidence/episodic-joint/ec24a07d-b3be-4a7d-839a-3a17e9f4f3ac/results.json) · [Independent recomputation audit](../evidence/episodic-joint/ec24a07d-b3be-4a7d-839a-3a17e9f4f3ac/audit.json) · [Protocol](../evidence/episodic-joint/ec24a07d-b3be-4a7d-839a-3a17e9f4f3ac/protocol.json).

## Intervention and protocol

The experimental controller chooses combinations of left/right correction and slow/fast movement from one bounded episodic store. A selected-speed action tag partitions retrieval; it is not a sensory measurement or future label. Both speed-conditioned searches are charged. Neural updates to both motor channels are disabled so unexecuted neural samples do not receive their motor credit. Other neural outputs retain the declared learning setting. Joint checkpoints carry their own model identity; offspring start with empty acquired experience.

The protocol crossed mixed/local features with the declared steering gains, holding speed levels, temporal-difference targets and credit windows fixed. It selected once on 12 development seeds before evaluating 30 untouched held-out seeds in both stable and relocating-food habitats. Each world used 24 matched founders, 1800 ticks, nutrient 0.4, and disabled reproduction and mutation. The archive contains 1008 worlds. Maximum recomputed energy-accounting residual: 2.3758275347063318e-9.

The gate required the original matched controls, stable preservation and relocation improvement against the incumbent, and evidence that adding steering helped relative to turn-disabled and binary speed-only controls. An energy signal alone did not waive the population guard.

## Held-out outcomes

Energy is learned minus control per founder; brackets are seed-level confidence intervals as declared in the protocol. Population is the mean ending-population difference per world. All controls and both habitats remain in the raw results.

| Control | Stable energy difference | Relocation energy difference | Relocation population difference |
| --- | ---: | ---: | ---: |
| Neural control | 4.692 [3.868, 5.515] | 9.143 [7.465, 10.821] | 1.167 |
| Confirmed cruising incumbent | -0.316 [-0.879, 0.246] | -0.404 [-1.356, 0.549] | -0.167 |
| Learning frozen | 2.339 [1.741, 2.937] | 0.439 [-0.594, 1.471] | -0.200 |
| Memory disabled | 2.184 [1.549, 2.818] | 0.664 [-0.411, 1.738] | -0.200 |
| Turn correction disabled | 0.496 [-0.277, 1.268] | 0.471 [-0.459, 1.402] | -0.100 |
| Binary speed-only | -0.280 [-0.936, 0.377] | -0.015 [-1.115, 1.085] | -0.267 |
| Full-range movement | 3.742 [2.738, 4.746] | 6.746 [5.604, 7.889] | 0.800 |

The overall habitat gate was **false**, incumbent gate **false**, and added-motor gate **false**. Stable learning advantages against frozen or memory-disabled controls did not establish improved adaptation to relocated food. The steering intervention has not qualified.

## Memory and inspection boundary

The separate cue-memory component passed (**true**). Its reward depends on correct turn while speed is freely selected; it exercises the representation and retrieval retention. It does not establish coordinated whole-body control, TD bootstrapping in the habitat, or broad continual retention. Browser DOM/API checks verified the four candidate estimates, selected actions, actual clipped outputs and recalled-record partitioning. Pixel layout was not verified in that inspection.

[Browser inspection evidence](../evidence/joint-inspection/7f927889-ae73-4c31-a912-ba5c045c42e1/) · [Binary compatibility](../evidence/joint-compatibility/final-results.json).

The audit recomputed the paired outcomes, selection, component intervals and gates and verified source/reference/diagnosis hashes. It did not replay every world. Old research runs must use their archived source trees as working directories. This is a human-designed controller experiment; RSI and human-like cognition remain unachieved.
