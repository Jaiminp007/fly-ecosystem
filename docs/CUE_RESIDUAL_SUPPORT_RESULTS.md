# Cue-residual support diagnosis

Among the selected founders' four B evaluation cues, 198/244 in the original
corpus and 200/244 in the conflicting corpus had **no matching own A/B taste
example**. All 398 corresponding cue-specific residuals remain exactly zero.
Despite that, the active-residual model's predictions can differ from the
shared-only control because active residuals changed the gradients applied to
the shared weights on other observed cues. The effects on unseen cues are
therefore altered generalization, not direct learned values for those cues.

Across pooled cue evaluations, mean control-minus-candidate B log loss for
unseen cues is +0.031021 original and +0.137264 conflict; signs vary by
history. Pooled cue counts weight founders differently from the prespecified
equal-history gate. The original 4/8 screen remains failed. The few one- and
multiple-example categories are repeated, selected observations and must not
be used to fit a new threshold or make physical claims.

`evidence/cue-residual-support/20261026-v1` contains source links and all 488
cue evaluations. The independent readback verifies support, zero residuals,
scores and original per-history loss arithmetic. It reuses previously audited
own factual examples and is not an independent physical simulation. Existing
failures, the original qualification benchmark and closed reserves remain.
