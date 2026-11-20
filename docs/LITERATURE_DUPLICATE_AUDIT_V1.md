# LITERATURE DUPLICATE AUDIT V1 — hook-name uniqueness (zero worlds)

Date: 2026-11-02. Analytic only (reads `docs/LITERATURE_MAP_OUTSIDE.md`;
zero new worlds). Trigger: R291 caught a person-identity gap (R290
used Laver-the-person as "R.Laver"; full-name grep for "Rod Laver"
missed it) — audited whether the virginity discipline leaked
elsewhere. Scope: R179+ canon hooks (447 hooks, 441 unique names).

## Method

Parsed `[canon: NAME ...]` first-tokens across R179+ rounds; counted
repeats; adjudicated each against full text (specified clauses +
hook descriptors + round themes).

## Findings (4 repeats in 447 hooks)

1. **Merton ×3 (R179 only) — BY DESIGN, no violation.** All three
   in the round about Merton (middle-range / self-fulfilling /
   unanticipated). Same person, same round, stated theme. The rule
   targets cross-round reuse; intra-round deliberate triple is the
   round's subject, not a leak.
2. **Hughes ×2 (R183 dirty-work vs R259 Langston) — DISTINGUISHED,
   no violation.** R259 specifies Langston + carries an explicit
   "(vs dirty-work FPs)" note — the collision was noticed and
   handled at write time. R183's hook is surname-only (older,
   looser round), but dirty-work = Everett Hughes unambiguously.
   Distinct persons, explicitly separated. Process worked.
3. **Brown ×2 (R249 Earle vs R252 Trisha) — MINOR FLAW, disclosed.**
   Both specified distinctly (Earle vs Trisha + hook descriptors
   "open form" vs "additive dance" — no person confusion), BUT the
   hook surname repeats: "Brown" was not virgin at R252. Strictly a
   hook-name reuse. Impact: nil on content (persons distinct), but
   the virginity ledger overstates uniqueness by one hook. Recorded,
   not repaired (never rewrite the map; the flaw is the record).
4. **Laver (R290 use, R291 near-reuse) — CAUGHT PRE-APPEND, no
   violation.** The R291 check caught R290's "R.Laver" use and
   dropped the hook. Process worked — but exposed the gap below.

## Discipline gap + repair (prospective only)

Full-name grep misses surname-form prior uses ("R.Laver" vs
"Rod Laver"). Repair: henceforth check BOTH the full name AND the
bare surname's context (read the hit lines, don't trust counts).
Applied from R292 onward. Past rounds stand as written (flaw in
(3) preserved above, not edited out).

## Standing

- Zero worlds. No content changes to the map. Cumulative unchanged
  (8351).
