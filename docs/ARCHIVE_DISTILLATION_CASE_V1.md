# ARCHIVE DISTILLATION CASE V1 (candidate, unlicensed — zero worlds)

Date: 2026-11-02. Status: CASE SPECIFIED, not scoped, not frozen.
R4 closed single-teacher distillation (BC of guarded, 0/8 by −0.57);
this doc specifies the different teacher-data regime that re-opens
distillation as a case to make — never as a re-run.

## The distinction (R782: Faldor 2023 + Kumar 2022)

- R4 distilled ONE demonstrator (guarded). Failure mode characterized
  by Kumar: BC cannot transcend its demonstrator's suboptimality.
- Archive distillation (Faldor: MAP-Elites archive → descriptor-
  conditioned gradients → single policy) distills DIVERSITY: the
  archive contains behaviors no single demonstrator shows.
- Kumar condition satisfied in form: the student CAN improve upon
  the data (the archive's best behaviors exceed any one teacher),
  rather than merely imitate it.

## What a case needs (not a plan)

A future scoping must name: the archive source (which diverse
behaviors, from where — no fresh bank without a frozen plan), the
distillation rule (frozen formula + billing), and the falsifier
(same as R4's: lose to the teacher set by the R4 margin band, and
archive-distillation closes with it). Until then this is a
specified case, not a queue entry.
