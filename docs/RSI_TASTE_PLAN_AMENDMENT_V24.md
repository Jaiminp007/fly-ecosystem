# RSI plan amendment v24: live/replay rate split (NEW CODE, third class)

## Why (the symmetry nobody questioned)

`tasteUpdate` uses ONE `tasteRate` for live single-sample updates AND
replay rehearsal. Both accepted dials circle step size from opposite
sides: tr=0.3 (Gen13) says smaller steps help LIVE (don't overreact to
single samples); R=4 (Gen6) says MORE rehearsal helps (rehearsal moves
weights ×4 per live step at same size). The joint optimum may be split:
cautious live + aggressive replay, or aggressive live + consolidating
replay. No setting of a single rate can express either. This is virgin
territory (rate was varied only jointly: tr∈{0.1..1} at R=1, {1} at
R=4).

## Code (new, default bit-exact)

* `replayRate` ρ ≥ 0, default 1. In `tasteUpdate`, replay mode only:
  `if(mode==='replay'&&ρ!==1)rate=m.mul(rate,ρ)` — the !==1 guard keeps
  the default path bit-identical (zero new ops). Live path untouched.
  Billed when active. Validation finite && >0 (0 allowed? No — 0 would
  silence replay; require >0; the OFF position is exactly 1).
* Config-only (persists in body, legitimate revision), no state keys,
  no work keys, reset/restore trivially safe (backfill 1, passthrough,
  keys audit). Runner `--replay-rate`; learnerOptions passthrough.
* Tests: default 1 bit-identical (weights + ops); validates 0/NaN/-2;
  ρ=2 doubles a replay step vs ρ=1 on a fixed record (seeded); live
  updates unaffected by ρ (live weights equal across ρ).

## Menu (Gen1 R=4 flags, (32,8), S=1, orthogonal, greedy, tr=1.0)

* Baseline: Gen1 R=4 (ρ=1).
* A (greedy): {ρ=0.5, ρ=2.0} (slow-replay vs fast-replay).
* B (random, matched): two of {ρ=0.25, ρ=1.5, ρ=4.0} via
  mulberry32(20261118).

## Rules unchanged

New search bank v26, `--count 4`, 6 arms + baseline cell same bank,
≤96/procedure matched A/B. No eval without dual-true beating baseline.
Claimant → fresh 8-history bank (6 arms, v2 gates + world-cap, copy
control). Gen-1 window: A-won accept = 1/2, then V25 revision of winner
A-won accept = 2/2 + budgets → claim.
Prediction on record: ρ=2 should beat level (rehearsal is averaged
direction — safe to stride) with retention intact; ρ=0.5 should starve
rehearsal (level down, retention down — R=4's gains need size AND
count). Asymmetry either way is informative: it tells us whether R=4
won on count or on total step-mass.
