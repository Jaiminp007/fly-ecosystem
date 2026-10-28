# Own-supported combined steering protection

Test one phase-blind candidate motivated by the shared/bank crossover. Maintain
one own-factual support flag per route and executed steering action. On an
update, apply the normal shared and current-route increments. For every other
previously supported route/action, compensate its bank by the negative actual
shared-weight change, so its combined shared-plus-bank coefficients remain
unchanged unless bank clipping prevents it. Mark the current route/action as
supported only after its own pending decision is updated. Unsupported routes
receive ordinary shared generalization; no phase, saved checkpoint, valence,
counterfactual reward or other body enters the learner.

Matched `protect` and `control` arms retain and update the same support flags,
calculate the same candidate corrections, and pay the same conservatively
declared work and encoded memory. Only the bank assignment differs. Test own
executed-action provenance, protected and unsupported routes, clipping,
terminal, reset, freeze, restore, debt and equal-cost controls. The mechanism
protects supported coefficients, not whole policies, competing actions, returns
or outcomes; unobserved absent routes are not protected. It can suppress useful
sharing and still fail later experience. Developmental physical and fresh
qualification gates remain mandatory and closed reserves remain closed.
