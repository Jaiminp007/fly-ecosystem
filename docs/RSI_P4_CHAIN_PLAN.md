# RSI P4: chain check over a wide odor (plan, frozen before the run)

Fourth stage of the RSI line. P2 and P3-A, the earlier RSI attempts, both failed their dev gates. The P3 headroom check and the P3-B probe showed the reason. The 4-bit taste space allows one useful jump (keepOnly/evid/k) and no second step. Even a perfect learner could only learn that one move. Fable's design response: make the task chain by construction. This plan tests whether that works **with no learner**. Only if it passes do we build a learner on top.

**Label.** This is a constructed task. The staircase rule and the one-bit-extension grammar are designed so that improvements must happen in sequence. Any later RSI pass on it is a result about this task and must be described that way.

## 1. Engine change (opt-in, default unchanged)

`tasteProgram.odor` is an optional table of 16 n-bit codes, indexed by the 4-bit cue pattern. Only the taste `masks` code reads it. Mask features then range over the n odor bits. Steering, contact and credit assignment still see the 4-bit physical cue.

`applyValenceRule` accepts `rule.odor` in the same way. Without `odor`, behaviour is unchanged: the masks loop bound becomes the cue length, which is 4, and the other code paths are untouched. Taste tests pass.

## 2. Task

There are 12 rules, `stair1..12`. Their bank seeds, 999001–999012, are fresh.

- **Odor table.** Each rule gets 16 distinct random 8-bit odor codes.
- **Valence.** The chemistry is a staircase over 4 random odor bits b1..b4 with a random sign: `value = sign * sgn(.5 + T1 + 2 T12 + 2 T123 + T1234)`, where `T1..k` is the product of bits b1..bk.
- **Why this rule.** A scratch brute force over all 16 patterns shows the best linear-readout accuracy rises in steps: .625 with {T1}, .75 with {T1,T12}, .875 with {T1,T12,T123} and 1.0 with all four.
- **Energy probe.** A scratch probe on 8 non-bank histories gave these energies for T1 → T12 → T123 → T1234:
  - rule 1: −47.2 → −44.8 → −41.3 → −40.8;
  - rule 2: −51.2 → −51.5 → −48.1 → −46.9;
  - rule 3: flat.

## 3. Search

- **Start program.** S0 is the constant term plus all 8 single odor bits, with step 4 and replays 1.
- **Grammar** (17 moves):
  - extend/{evid,random}/{1,2}: add children of current terms that differ by one bit;
  - remove/{weak,random}/{1,2,4};
  - keepOnly/evid/{1,2,3,4};
  - 4 knob moves for step and replays.
- **Evidence.** Evidence is the flies' own term evidence. It ranks only current terms and their one-bit children.
- **Accept rule.** Identical to P2/P3: the dev gain must be > 0 with ≥ 4/6 wins, and a confirmation on 6 fresh histories must also pass. Budget: 18 evaluations.
- **Orders compared.** Greedy is the fixed hand-coded order in the script. Uniform uses a random order with seed 1.
- **Final score.** Energy per founder on 8 held-out histories.

## 4. Criteria (all four must pass)

- **C1 chain.** Greedy accepts ≥ 3 moves on ≥ 8 of 12 rules.
- **C2 order.** Take the concrete edit of each chained rule's third accepted move: terms added or removed, knob changes. Applied straight to S0, its mean dev gain is ≤ 0.5 × its mean in-chain dev gain.
- **C3 no shortcut.** The shortcut is keepOnly top-k by S0 evidence over every term of order ≤ 4, with k ∈ {1,2,3,4,6}, scored by the best k on the final histories. Mean (greedy final − best shortcut) must be ≥ 1.0.
- **C4 headroom.** Mean (greedy final − uniform final) must be ≥ 1.5. This is the room a learner would have to close.

If C1–C4 pass, the next step is a P4 learner dev check using the P3-A runner design (greedy-by-posterior eval, fresh banks). If any fail, stop and report.

Runner: `scripts/rsi-p4-chain-check.mjs`. Output goes to `evidence/rsi-p4-chain/`.
