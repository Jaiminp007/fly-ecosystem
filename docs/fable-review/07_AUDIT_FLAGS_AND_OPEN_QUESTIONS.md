# 07. Known weaknesses, audit flags and open questions

This is my (the executing agent's) own list. It is not exhaustive, and the
reviewer should look for more.

## Validity concerns

1. **Design iteration across versions.** V5 → V6 → V7 each changed the
   design after seeing the previous result. These changes include the U
   space (power, meanGain), the budget, the test size and C2's definition.
   Each version used a fresh test bank. Even so, the forking paths across
   versions amount to multiple testing, and that was never corrected for.
2. **The scoring amendment.** `discrimination` replaced `score` during V5,
   before its test. It is better justified (it removes base-rate reward),
   but it is still a mid-line change.
3. **Pair non-independence.** The sign tests treat 48 or 72 rows as
   independent. They share 3 trained libraries and 8 rules, and library
   quality varies a lot by training seed (V7 U*: 0.517 in replicate 101 vs
   0.467 in replicate 102). The true unit may be the replicate (n = 3).
4. **Level 2 is weak and noisy.** Validation is 24 rows, the acceptance rule
   is "mean higher and wins > losses", and there is no confirmation. V6
   accepted α 2 at 15–5. V7 rejected power 2 even though the dev check
   strongly favoured it, so validation noise may dominate.
5. **C1 compares U* to U0 using one trained library per replicate.**
   Training-seed luck can swamp a difference between update rules.
6. **The genes are hand-written,** including the `evid` ranking that reads
   the flies' own experience. "Invention" is mutation inside a 90-move
   grammar I designed.
7. **The worlds are easy and short.** No fly dies, there is no energy
   benefit, and the effects are about 0.02–0.05 of discrimination. A
   correct small code reaches about 0.6–0.68, so most of the headroom is
   unused.
8. **Restarts in V7** (OOM, then a reboot) were handled by deterministic
   resume, and replicate 101 reproduced exactly. The reviewer should check
   that `resume` and the checkpoint cannot leak test information into
   anything that was decided.

9. **V6 and V7 share their trained libraries.** Deterministic training,
   with the same seeds and the same U*, gave identical libraries. So V7 was
   not an independent replication at the library level. Across both
   versions, every positive signal comes from the one replicate-101 library.

## Open questions for the reviewer

- Is the C1/C2/C3 framing a sound operationalisation of "RSI" for this
  project, or should it change?
- Should the unit of analysis be the training replicate rather than the
  row? If so, what N would be needed?
- Is the bottleneck the meta-learning machinery, or the substrate? The
  substrate has small headroom, deathless short worlds, and an identity
  start that is already about 0.46.
- What would make the flies actually perform better (survival and energy,
  not just discrimination)? Harsh, long worlds? Richer level-0 programs?
- Should level 2 be revisable (level 3), or is that premature?
- How should the project avoid an endless V8, V9, … cycle of near-misses?
