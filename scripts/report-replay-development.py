"""Preserve a checked replay-development decision and its checker correction."""
import hashlib
import json
from pathlib import Path
import runpy
import sys


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    with path.open('x', encoding='utf8', newline='\n') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')


directory = Path(sys.argv[1])
folder = directory / 'development'
p = json.loads((directory / 'protocol.json').read_text(encoding='utf8'))
r = json.loads((folder / 'results.json').read_text(encoding='utf8'))
assert r['rowSha256'] == [sha(folder / 'rows' / f"{h['seed']}.json") for h in p['developmentHistories']]
physical = json.loads((folder / 'physical-audit.json').read_text(encoding='utf8'))
numeric = json.loads((folder / 'numeric-audit.json').read_text(encoding='utf8'))
for audit in (physical, numeric):
    assert audit['passed'] and audit['protocolSha256'] == sha(directory / 'protocol.json')
    assert audit['resultsSha256'] == sha(folder / 'results.json')
assert not numeric['warnings'] and numeric['learnerBodies'] == 8 * 6 * 24
assert not r['promising'] and not r['qualified'] and not (directory / 'confirmation').exists()

original = runpy.run_path(str(directory / 'sources/scripts/audit-sarsa-screen.py'))
corrected = runpy.run_path(str(directory / 'supplemental/checker-v2/audit-sarsa-screen.py'))
trace = folder / 'numerics' / f"{p['developmentHistories'][0]['seed']}.jsonl"
seed = p['developmentHistories'][0]['seed']
old_empty = original['audit_trace'](trace, seed, 'linear-retrace-v1')
assert old_empty == {'factualTransitions': 0, 'decisions': 0, 'learnerBodies': 0}
try:
    corrected['audit_trace'](trace, seed, 'linear-retrace-v1')
except AssertionError as error:
    rejection = str(error)
else:
    raise AssertionError('The corrected checker accepted an empty program selection')

files = ['audit-replay-development.py', 'audit-sarsa-development.py', 'audit-sarsa-screen.py']
correction = {'schema': 1, 'protocolSha256': sha(directory / 'protocol.json'),
    'originalCheckerIssue': 'Original checker/test filtered by learner IDs, but recorded events use roles candidate/oneStep/linear. A missing program selection returned zero counts without failing. Discovered before the full scientific numeric audit completed; its earlier focused-test pass was vacuous for learned-policy arithmetic.',
    'correction': 'Use recorded role names, assert a nonempty audited learner set, and require exactly 96 candidate-arm bodies plus 24 one-step and 24 linear bodies per history. The corrected engineering fixture requires 16/4/4 audited bodies and performs the actual independent arithmetic checks.',
    'originalWrongFilterCounts': old_empty, 'correctedWrongFilterRejection': rejection,
    'originalSources': {name: sha(directory / 'sources/scripts' / name) for name in files},
    'correctedSources': {name: sha(directory / 'supplemental/checker-v2' / name) for name in files},
    'originalTestSha256': sha(directory / 'engineering/retrace-sarsa.test.mjs'),
    'correctedTestSha256': sha(directory / 'supplemental/checker-v2/retrace-sarsa.test.mjs'),
    'scope': 'Checker/test correction only. Every frozen learner source, protocol, trace, row, score and scientific gate stays unchanged. No new performance observations, tuning, or confirmation collection.',
    'numericAuditSha256': sha(folder / 'numeric-audit.json')}
save(directory / 'supplemental/checker-correction.json', correction)
required = [c for c in r['comparisons'] if not c['optional']]
failed = [c['id'] for c in required if not c['developmentalPositive']]
decision = {'schema': 1, 'passed': False, 'developmentPassed': r['promising'], 'qualified': r['qualified'],
    'requiredPositiveMeans': sum(c['developmentalPositive'] for c in required), 'requiredContrasts': len(required),
    'failedEnergyContrasts': failed, 'survivalGuardsPassed': sum(v['passed'] for v in r['survival']), 'survivalGuards': len(r['survival']),
    'multiStepHistoriesPassed': sum(v['passed'] for v in r['replayActivity']), 'histories': 8, 'confirmationExists': False,
    'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(folder / 'results.json'),
    'physicalAuditSha256': sha(folder / 'physical-audit.json'), 'numericAuditSha256': sha(folder / 'numeric-audit.json'),
    'checkerCorrectionSha256': sha(directory / 'supplemental/checker-correction.json'),
    'nextObligation': 'Preserve the failed hypothesis and exclude every registered seed including the unused reserve. Continuing embodied distinct-task learning and per-skill retention remain unqualified. Diagnose limitations before proposing another prospectively fixed fresh hypothesis; persistent autonomous revision and copied-improvement/search-productivity studies still require a qualified substrate.',
    'boundary': 'No confirmation, tuning, extension, reselection, promotion, or RSI claim on this bank.'}
save(folder / 'decision.json', decision)

rows = [json.loads((folder / 'rows' / f"{h['seed']}.json").read_text(encoding='utf8')) for h in p['developmentHistories']]
test_bytes = Path('runs/sarsa-screen-retrace-tests.log').read_bytes()
test_text = test_bytes.decode('utf16' if test_bytes.startswith(b'\xff\xfe') else 'utf8')
assert all(token in test_text for token in ['# tests 157', '# pass 157', '# fail 0', '# skipped 0'])
wall = sum(row['runtime']['wallSeconds'] for row in rows)
cpu = sum(sum(row['runtime']['cpuMicroseconds'].values()) for row in rows) / 1e6
lines = ['# Bounded replay: development result', '',
    f'The fixed bounded replay candidate **failed development**: {decision["requiredPositiveMeans"]} of {len(required)} required energy means were positive, {decision["survivalGuardsPassed"]} of {len(r["survival"])} survival guards passed, and all eight replay-activity gates passed. Sixteen reserved confirmation histories remain unrun. The full research goal remains active; embodied qualification and every later causal recursive-improvement stage remain unachieved.', '',
    f'The [prospective design](RETRACE_DEVELOPMENT.md) and [frozen protocol](../{directory.as_posix()}/protocol.json) specify one fixed hypothesis. It completed 80 main worlds and 144 probes across eight independent histories. Collection took {wall:.3f} wall seconds and {cpu:.3f} process CPU seconds. These timings are separate from the declared embodied energy charges.', '',
    '| Required contrast | Mean energy per founder | Simultaneous lower bound | Development mean > 0 |', '| --- | ---: | ---: | --- |']
for c in required:
    lines.append(f'| {c["id"]} | {c["mean"]:.6f} | {c["simultaneousLower"]:.6f} | {c["developmentalPositive"]} |')
lines += ['', 'Development uses positive means; the displayed bounds and exact paired sign-flip tests are descriptive here. This bank supplies no confirmatory qualification. The candidate was above the matched one-step program on mean sequence energy, but below the earlier linear learner, and failed the separate B-retention contrast. These comparisons across a new development bank do not show that replay improved learning in general.', '',
    '| Survival control | Mean survival difference | Gate |', '| --- | ---: | --- |']
for v in r['survival']:
    lines.append(f'| {v["control"]} | {v["mean"]:.6f} | {v["passed"]} |')
activity = r['replayActivity']
lines += ['', f'Multi-step replay accounted for {min(v["fraction"] for v in activity):.2%}–{max(v["fraction"] for v in activity):.2%} of candidate updates. Mean backup length ranged from {min(v["meanSteps"] for v in activity):.3f} to {max(v["meanSteps"] for v in activity):.3f}; every history reached the fixed 16-record cap. Thus the temporal-credit manipulation occurred even though the overall screen failed.', '',
    f'Full cold replay exactly reproduced all 80 main worlds, 144 probes, factual trace hashes, row objects, and scores. Independent Python rebuilt {numeric["factualTransitions"]:,} factual transitions, {numeric["decisions"]:,} learned-policy decisions, {numeric["learnerBodies"]:,} learner bodies, and {numeric["reflexDecisions"]:,} fixed-reflex choices, with zero warnings. The full Node suite passed 157 tests with the independent Python checks enabled; the Python controller adapter test also passed.', '',
    'The original frozen checker and its focused test had a disclosed filter bug: they selected learner IDs while traces used role names, allowing a zero-record selection. Review caught this before the full scientific numeric audit completed. The corrected checker uses actual roles and requires exact nonzero body counts. Its corrected fixture performs the independent updates and policy checks. [The correction record](../' + directory.as_posix() + '/supplemental/checker-correction.json) preserves original and corrected source hashes and demonstrates that a wrong filter is now rejected. Frozen experimental sources and every outcome remain unchanged.', '',
    'No confirmation collection, parameter change, alternative replay variant, sample extension, promotion, or RSI claim follows this failure. Previous failed gates and the historical strict portability discrepancy remain preserved. The next research obligation is a qualified embodied learner with separate skill retention under interference; persistent autonomous revisions and improved subsequent search against copied-improvement and matched-budget controls remain later required stages.', '']
with Path('docs/RETRACE_RESULTS.md').open('x', encoding='utf8', newline='\n') as stream:
    stream.write('\n'.join(lines))
print(json.dumps(decision))
