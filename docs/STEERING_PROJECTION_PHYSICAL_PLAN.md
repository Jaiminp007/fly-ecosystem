# Matched physical steering projection development

Compare `project` and `control` steering modes over the same eight reused
development histories and original 512/512/512/256 acquisition schedule.
Both arms physically construct and update the same own-action mean state,
compute the projection and pay the same declared operation and storage costs;
only applying the projected shared update differs. Both use the same
shared-plus-cue taste learner and original acquisition, sensors and controls.
Freeze motor banks after A as before. No phase label enters the algorithm.

Save A/B/C/D checkpoints, run A/B saved/current/reset probes and transfer
current/reset/native/guarded/cheap-native controls on each arm's own D world.
Retain trace hashes, compressed traces and compressed full checkpoints. Exact
world equality applies to probes forked from the same arm, not across the
independently evolving arms. Reconstruct ledger and model ancestry separately,
then independently audit actual own-action projection and terminal updates.

Report original exploratory transfer rule, survival, A/B acquisition,
functional pressure and retention with all missing data treated as failure.
Raw reused-data pressure and retention values are descriptive, not statistical
qualification. No reserve is opened. A pass requires fresh audited outcomes
and the later autonomous revision stage remains separate.
