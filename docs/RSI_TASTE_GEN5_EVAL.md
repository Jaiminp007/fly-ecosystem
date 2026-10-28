# RSI gen5 fresh eval (stratified S=4) — FAIL, tradeoff persists

Predeclared claimant rule (score-best, amendment v4). Fresh bank `91efe192…`,
48 worlds, full v2 gates.

## Outcome: FAIL

* vs unlearned +4.68, 8/8, +74 — pass. vs frozen +3.22, 8/8 — pass.
* vs reset +0.99, 7/8, +12; worst −0.15 — pass noninferiority (strongest reset
  leg of any claimant so far).
* Skills: aSkill 8/8, bSkill 8/8, bAcq 8/8 — pass.
* **aRetention +0.18, 6/8 — PASS** (losses only −0.72, −0.05).
* **bRetention −0.12, 2/8 — FAIL** (descriptive 0.682/0.839 = 81%).
* Transfer 0.0 exactly — pass.

## Reading

Stratified replay moved the tradeoff but did not break it: S=4 over-protects
old (A-phase) records and starves the middle skill B worse than any prior
claimant (81% vs gen4's 92%). Three claimant mechanisms now fail the joint
margin in alternating directions — uniform-large-older (B✓/A✗), wide-recent
(A✓/B✗), stratified (A✓/B✗✗). The single replay buffer's composition always
rations one skill. A tradeoff-breaking revision needs separate skill streams
with endogenous routing or consolidation dynamics — a new algorithm build, not
a parameter.

## Accounting

* gen5 round: 16 (v5 base) + 48 (A5) + 96 (B5) + 48 (eval) = 208 worlds.
* Cumulative RSI: prior 1008 + 208 = **1216 worlds**.
* Claimants evaluated fresh: 4 (td, 64/8, 32/16, S=4), all FAIL. Successive
  accepts: **0/2**. Revisions SUSPENDED (reaffirmed): no further search without
  a new-algorithm build. Gen0-memory stays the unrevised qualified base.
