"""Render a review report using only the recorded study/audit artifacts."""
import json
import pathlib
import sys

directory = pathlib.Path(sys.argv[1])
output = pathlib.Path(sys.argv[2])
protocol = json.loads((directory / 'protocol.json').read_text())
result = json.loads((directory / 'results.json').read_text())
lock = json.loads((directory / 'locked-selection.json').read_text())
numeric_file = directory / 'numeric-audit-v3.json'
numeric = json.loads(numeric_file.read_text()) if numeric_file.exists() else None
audit_file = directory / 'audit.json'
audit = json.loads(audit_file.read_text()) if audit_file.exists() else None
relative = '../' + str(directory)
lines = ['# Assignment, history and horizon: results', '',
         f"The locked action-value gate **{'passed' if result['actionPassed'] else 'failed'}**. The weighting follow-up screen **{'passed' if result['mechanismPassed'] else 'failed'}**. Weighting research advancement: **{result['advanceWeighting']}**. No embodied qualification or RSI result follows.", '',
         f"[Protocol]({relative}/protocol.json) · [Selection locked before held-out collection]({relative}/locked-selection.json) · [Full results]({relative}/results.json) · [Design and review](INTERVENTION_STUDY.md)", '',
         f"The selection used {len(protocol['developmentSeeds'])} development seed pairs, split into {len(protocol['trainingSeeds'])} fitting and {len(protocol['selectionSeeds'])} selection pairs. The frozen candidate was `{lock['selected']['mode']}` with `{lock['selected']['representation']}` observations at {protocol['primaryHorizon']} ticks. The confirmation bank contains {len(protocol['heldoutSeeds'])} fresh seed pairs and {result['scheduledCases']} scheduled founder/checkpoint cases. It never trained the models.", '',
         '## Primary action-value comparisons', '',
         'Effects are target-agent energy change after one forced eight-tick speed interval and incumbent continuation. Constant controls refer only to that first interval. Positive effects favor the selected learner. Bounds are simultaneous one-sided Student-t lower bounds with the protocol family correction; tests additionally require the declared paired sign-flip threshold.', '',
         '| Environment | Control | Mean selected advantage | Simultaneous lower bound | Paired p | Passed |',
         '| --- | --- | ---: | ---: | ---: | --- |']
for environment in protocol['reference']['environments']:
    for control in ['incumbent', 'slow', 'fast']:
        test = result['tests'][f'{environment}:action:{control}']
        lines.append(f"| {environment} | {control} | {test['mean']:.6f} | {test['lower']:.6f} | {test['pOneSided']:.8f} | {test['passed']} |")
lines += ['', '## Scope and interpretation', '',
          f"The short- and long-horizon action-effect signs disagreed in {100 * result['shortLongSignDisagreement']:.2f}% of active held-out cases. This is a within-bank descriptive observation, not independent samples at each checkpoint. There were {result['alreadyDeadCases']} already-dead scheduled cases; terminal branch counts were {json.dumps(result['terminalBranchCounts'])}. The collector/test suite supports terminal outcomes, but this performance bank supplies no mortality case evidence.", '',
          result['mechanismInterpretation'], '',
          'Other model/representation tables in the raw results are diagnostic. They cannot replace the locked candidate or turn this failed held-out gate into a successful qualification. All models pool development founders and use simulator fork labels. None establishes learning from its own resulting body trajectory. The experiment does not measure retained distinct skills or recursive search.', '',
          '## Verification', '']
if audit:
    lines.append(f"The [cold replay audit]({relative}/audit.json) reproduced all {audit['worldsColdReplayed']} physical worlds, {audit['scheduledCases']} scheduled cases and {audit['forkWorldSteps']} fork steps; rebuilt {audit['modelsRebuilt']} models; and reproduced selection, scores and gates. These are reproducibility checks, not a new scientific sample.")
else:
    lines.append('The complete cold physical replay is still running. Do not interpret the completed numerical audit as completion of the physical audit.')
if numeric:
    lines += ['', f"The [independent numerical audit]({relative}/numeric-audit-v3.json) checked {numeric['modelsChecked']} fits and {numeric['comparisonsChecked']} comparisons. Maximum coefficient difference: {numeric['maxCoefficientDifference']:.3e}; maximum inverse residual: {numeric['maximumInverseResidual']:.3e}; maximum independently reconstructed delayed-DR target difference: {numeric['maximumDelayedDRTargetDifference']:.3e}. Recorded warnings: {len(numeric['warningMessages'])}. Checks passed: {numeric['allNumericalAndStatisticalChecksPassed']}.", '',
              f"The original numerical checker emitted matrix-multiply RuntimeWarnings despite passing its comparisons. Its warning list covered only a subset of operations. The original source, reports and process output are preserved. A [supplemental checker correction]({relative}/numeric-checker-resolution.json) captures all warnings and uses explicit finite reductions for inverse/prediction/statistical products. It changes no scientific model, choice, score or acceptance rule. No cause is assigned to the original warning messages."]
lines += ['', f"An [early scoring attempt]({relative}/evaluation-attempt-before-bank-complete.log) refused the incomplete held-out bank with a missing-file error. No result was written by that attempt. Scoring ran successfully only after collection finished.", '',
          '## Next work', '',
          'Preserve the failed gate and do not extend this sample or expand weighting qualification. Use the diagnosis to specify a separate embodied learning screen. The [continuing-body substrate](EMBODIED_SUBSTRATE.md) is implemented but unqualified: it has independent phase resource layouts, per-founder own experience, bounded memory, terminal labels and exact checkpoints. A fresh prospective protocol must set actual cost accounting, per-skill and survival margins, matched controls, and fixed total budgets before performance runs. The [revised research goal](RESEARCH_GOAL.md) remains unachieved.', '']
output.write_text('\n'.join(lines))
print(json.dumps({'report': str(output), 'actionPassed': result['actionPassed'], 'physicalAuditComplete': audit is not None, 'numericalAuditComplete': numeric is not None}))
