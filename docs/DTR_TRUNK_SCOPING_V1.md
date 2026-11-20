# DTR TRUNK SCOPING V1 (part-i instrument design) — DESIGN ONLY

Date: 2026-11-02. Status: DESIGN ONLY (no license, no bank, no code).
Parent: DTR_SCOPING_V1 (BLOCKED-substrate, 5-part work list). This note
designs part (i) far enough that its dependencies are explicit — and
finds part (i) depends on part (iv) first.

## Dependency order (new; the parts list had none)

(iv) second qualified task → (i) shared trunk → (ii) cross-task
transplant → (iii) backward scorer → (v) frozen DTR line. Rationale:
a trunk cannot be tested with one task (nothing to share between);
transplant needs the trunk's shape; the scorer needs transfers to
score; the line needs all three. The critical path starts at (iv),
not (i).

## Part (i) options (from R329/R335 precedents, mapped to concrete choices)

- Option A (von Oswald): task-conditioned hypernetwork generates
  task weights; rehearse weight realizations (regularized), not data.
  Needs: task index in (labels first, inference later), generator
  substrate, realization store. Biggest build; most general.
- Option B (TAME): shared trunk + task-indexed experts, routing by
  detected distribution shift. Needs: trunk, expert slots, shift
  detector. Middle build; routing is the hard part (Lei/Hafez:
  infer, don't require IDs — lead with inference-head).
- Option C (Partial): frozen shared chemotaxis trunk + SMALL task
  heads; generate heads only. Needs: head slots, head generator.
  Smallest substrate delta; directly applicable sizing (generate
  late, freeze early). Recommended IF (iv) qualifies an odor/mating
  task with head-shaped outputs.
- Constraint (dependency-preservation): weights are niche models
  (1-NN 1.000, structured) — generation must respect structure
  (no flat vectors); the trunk itself must be structured.
- Middle path (CP-MoE transient expert): isolate-vs-share tradeoff
  is the design tension; steal the transient expert (early task
  signal shared, late signal isolated) when sizing heads.

## Open questions (must close before any part-(i) freeze)

1. What IS shared between taste chemotaxis (96-dim) and the second
   task? (Nothing today — the trunk is green-field, not extracted.)
2. Trunk dim, head dim, generator form (hypernetwork? linear?).
3. Cross-task transplant definition (part ii) constrains trunk shape
   — design (i)+(ii) together, not in sequence.
4. Which task pair? (taste→odor needs odor qualified = part iv.)

## Verdict

Part (i) is designable but not freezable: it waits on (iv). The
concrete next program step on the DTR path is NOT trunk work — it
is scoping part (iv) (second-task qualification). Recorded so no
trunk code starts prematurely.
