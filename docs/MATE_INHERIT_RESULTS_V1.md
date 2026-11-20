# MATE-INHERIT results — V1 NOGO (transmission works, changes nothing)

Frozen: `docs/MATE_INHERIT_PLAN_V1.md`. Single authorized attempt:
12 mains (2 arms × 6 histories, fresh bank 405001–405054), 0 probes.
No crashes, no resume (`redone: []`).

## Verdict: MATE-INHERIT-NOGO (pre-registered branch, executed exactly)

- G1 integrity ✓: 12/12 mains complete; ledger exact
  (12/0/21504/516096/2.05e9); `redone` empty; all rows carry arm + mode +
  founders + births.
- G2 audit ✓: per-row transmission mode matches arm; all birth counts
  integer ≥ 0.
- G3 outcome: maternal total = 16, control total = 16, gap = **0**
  (bar: ≥+6) → NOGO ("transmission does not lift lineage productivity").
  Not INCOMPLETE (births occurred: 32 total) — the test was well-posed.

## What this decides (and the per-seed mirror that sharpens it)

Births per seed, both arms: 3, 2, 2, 1, 5, 3 — IDENTICAL. The mechanism is
verified end-to-end (unit test proves maternal weights copy into newborns;
plumbing audited in code; null-default triage clean): every one of the 16
maternal births carried copied maternal weights, and lineage productivity
is byte-for-byte the same as zeroed newborns.

Two readings, both consistent with the verdict:
(a) transmitted weights confer no advantage within one generation window
(newborns may die before their inheritance matters; founders — identical
in both arms — do most of the mating);
(b) the per-seed identity suggests birth counts are set by ecology
(co-location luck), not by who the newborns are.
Either way: maternal exact-copy transmission does not move the needle in
this substrate. The MLS requirement (couple replication with HERITABLE
variation that selection can act on) is unmet — but for lack of EFFECT,
not for lack of mechanism: the channel works, the content doesn't matter
(here, yet).

## What this does NOT disturb

MATE-ENERGY's GO stands (bar-50 unlocks births — replicated here: 32/32
births across both arms on a fresh bank). The inheritance line is closed
only for exact-copy maternal transmission; untested variants remain
explicitly open: mutated copies (planned V1b, now UNLICENSED by this
NOGO — a V1b needs a new rationale, e.g., multi-generation tracking
showing where copies go), paternal/mixed inheritance, slow-weight
(Baldwin) transmission, and — most importantly — any version that first
demonstrates newborns surviving to mate (without gen-2+ events there is
nothing for heritability to compound).

## Standing rules applied

Bank fixture converted to rebuild-refusal guard pre-execution (ninth
instance); regression unit test added for the crash fix; triage: 6
pristine failures only. Dual provenance preserved (executionSources =
pre-fix code; scorer ran post-fix on identical rows — wait, no rescore
occurred: dev-results computed once, post-fix. The fix preceded all 12
mains of THIS line (fresh bank, fresh run — unlike MATE-ENERGY's
mid-line resume). Stated plainly to avoid confusion.

## Books (exact ledgers vs headline)

This line: 12 mains, 0 probes, ledger exact (12/0/21504/516096/2.05e9).
Headline: 7515 + 12 = 7527 (recurrence from last published; per-line
ledgers remain the authoritative record).
AUDIT NOTE: the historical headline chain has known drift (V1d wrote
7491 for 7471+32=7503; MATE-ACT then added to the wrong base). A full
recount finds 919 mains + 1944 probes = 2863 worlds across 28 ledgered
attempt dirs on top of the frozen 5128 V35 baseline; fixture/synthetic
counting varied by era, so no single headline number is exact. Going
forward the headline is carried as last-published + new worlds, and
only per-line ledgers are cited as exact.
